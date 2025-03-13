package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os/exec"
	"sync"
	"time"
	"os"
	"strings"
	"gopkg.in/yaml.v3"
	"strconv"
)

// Global logger
var logger *log.Logger

// Shared data structure to store node information
var (
	nodeCache struct {
		Count    int      `json:"count"`
		Roles    []string `json:"roles"`
		LastSync time.Time
	}
	nodeCacheMutex sync.Mutex
)

func init() {
	// Initialize logger with timestamp and caller info
	logger = log.New(os.Stdout, "[AVS Console (API)] ", log.Ldate|log.Ltime|log.Lshortfile)
}

// Node represents an Aerospike node in the cluster
type Node struct {
	NodeID   string `json:"nodeId"`
	Role     string `json:"role"`
	Endpoint string `json:"endpoint"`
	Version  string `json:"version"`
}

// Index represents a vector index
type Index struct {
	Name        string  `json:"name"`
	Dimensions  int     `json:"dimensions"`
	Metric      string  `json:"metric"`
	Mode        string  `json:"mode"`
	Status      string  `json:"status"`
	VectorCount int     `json:"vectorCount"`
	Unmerged    float64 `json:"unmerged"`
}

// User represents a system user
type User struct {
	Username string   `json:"username"`
	Roles    []string `json:"roles"`
}

// Role represents a system role
type Role struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

// ClusterInfo represents information about the cluster
type ClusterInfo struct {
	ClusterID     string   `json:"clusterId"`
	Version       string   `json:"version"`
	ClusterSize   int      `json:"clusterSize"`
	TotalVectors  int      `json:"totalVectors"`
	NodeRoles     []string `json:"nodeRoles"`
	ActiveCluster string   `json:"activeCluster"`
}

// QueryResult represents a vector search result
type QueryResult struct {
	ID         string  `json:"id"`
	Similarity float64 `json:"similarity"`
	Metadata   string  `json:"metadata"`
}

// ConfigInfo represents the current configuration
type ConfigInfo struct {
	ConfigFile     string `json:"configFile"`
	Host          string `json:"host"`
	Seeds         string `json:"seeds"`
	CLIInstalled  bool   `json:"cliInstalled"`
	CLIVersion    string `json:"cliVersion"`
	CLIDownloadURL string `json:"cliDownloadUrl"`
}

// IndexInfo represents detailed information about an index
type IndexInfo struct {
	Name            string            `json:"name"`
	Namespace       string            `json:"namespace"`
	Set             string            `json:"set"`
	Field           string            `json:"field"`
	Dimensions      int               `json:"dimensions"`
	DistanceMetric  string           `json:"distanceMetric"`
	Unmerged        int              `json:"unmerged"`
	VectorRecords   int              `json:"vectorRecords"`
	Size            string           `json:"size"`
	UnmergedPercent string           `json:"unmergedPercent"`
	Mode            string           `json:"mode"`
	Status          string           `json:"status"`
	Vertices        int              `json:"vertices"`
	Labels          map[string]string `json:"labels"`
	Storage         string           `json:"storage"`
	Parameters      map[string]string `json:"parameters"`
}

// Helper function to update node cache
func updateNodeCache() error {
	nodeCacheMutex.Lock()
	defer nodeCacheMutex.Unlock()

	cmd := exec.Command("asvec", "node", "ls", "--format", "1")
	output, err := cmd.Output()
	if err != nil {
		return err
	}

	// Parse the output
	lines := strings.Split(string(output), "\n")
	if len(lines) < 3 {
		return fmt.Errorf("invalid node list output")
	}

	// Reset roles slice
	uniqueRoles := make(map[string]bool)
	var nodes []Node

	// Process each line (skip first two header lines)
	for _, line := range lines[2:] {
		if strings.TrimSpace(line) == "" {
			continue
		}

		fields := strings.SplitN(line, ",", 7)
		if len(fields) >= 6 {
			role := strings.TrimSpace(fields[2]) // Roles field
			if role != "" && role != "N/A" {
				uniqueRoles[role] = true
			}
			nodes = append(nodes, Node{
				NodeID:   strings.TrimSpace(fields[1]),
				Role:     role,
				Endpoint: strings.TrimSpace(fields[3]),
				Version:  strings.TrimSpace(fields[5]),
			})
		}
	}

	// Convert unique roles to slice
	var roles []string
	for role := range uniqueRoles {
		roles = append(roles, role)
	}

	// Update cache
	nodeCache.Count = len(nodes)
	nodeCache.Roles = roles
	nodeCache.LastSync = time.Now()

	logger.Printf("Updated node cache: count=%d, roles=%v", nodeCache.Count, nodeCache.Roles)
	return nil
}

func main() {
	logger.Println("Starting AVS Server...")
	
	// Add a basic health check endpoint
	http.HandleFunc("/api/health", corsMiddleware(func(w http.ResponseWriter, r *http.Request) {
		logger.Println("Health check requested")
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	}))

	// Add debug endpoint to test JSON response
	http.HandleFunc("/api/debug", corsMiddleware(func(w http.ResponseWriter, r *http.Request) {
		logger.Println("Debug endpoint requested")
		w.Header().Set("Content-Type", "application/json")
		debugInfo := map[string]interface{}{
			"timestamp": time.Now(),
			"headers":   r.Header,
			"method":    r.Method,
			"url":       r.URL.String(),
		}
		json.NewEncoder(w).Encode(debugInfo)
	}))

	http.HandleFunc("/api/cluster/info", corsMiddleware(getClusterInfo))
	http.HandleFunc("/api/nodes", corsMiddleware(getNodes))
	http.HandleFunc("/api/indexes", corsMiddleware(getIndexes))
	http.HandleFunc("/api/users", corsMiddleware(getUsers))
	http.HandleFunc("/api/roles", corsMiddleware(getRoles))
	http.HandleFunc("/api/query", corsMiddleware(executeQuery))
	http.HandleFunc("/api/config", corsMiddleware(getConfig))

	// Enable CORS
	http.HandleFunc("/", corsMiddleware(enableCORS))

	// Start server
	port := ":8080"
	logger.Printf("Server listening on %s", port)
	if err := http.ListenAndServe(port, nil); err != nil {
		logger.Fatalf("Server failed to start: %v", err)
	}
}

func enableCORS(w http.ResponseWriter, r *http.Request) {
	// Allow requests from any origin in development
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE")
	w.Header().Set("Access-Control-Allow-Headers", "*")
	
	logger.Printf("Setting CORS headers for request from: %s", r.RemoteAddr)
}

func corsMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		logger.Printf("Received %s request from %s", r.Method, r.RemoteAddr)
		
		// Handle preflight requests
		if r.Method == "OPTIONS" {
			enableCORS(w, r)
			w.WriteHeader(http.StatusOK)
			return
		}

		enableCORS(w, r)
		next(w, r)
	}
}

func getNodes(w http.ResponseWriter, r *http.Request) {
	enableCORS(w, r)
	logger.Printf("Handling node list request from %s", r.RemoteAddr)

	// Prepare the command without --format 1 and --verbose for logging
	cmd := exec.Command("asvec", "node", "ls", "--format", "1")
	logger.Printf("Executing command: %s", cmd.String()) // Log the command

	// Capture output and error
	output, err := cmd.CombinedOutput() // This captures both stdout and stderr
	if err != nil {
		logger.Printf("Error executing node list command: %v", err)
		logger.Printf("%s", string(output)) // Log the output without prefix
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode([]Node{}) // Return empty array instead of dummy data
		return
	}

	// Log the command output with an extra newline
	logger.Printf("\n%s", string(output))

	// Parse CSV output
	lines := strings.Split(string(output), "\n")
	var nodes []Node

	// Skip header lines (first two lines)
	for _, line := range lines[2:] {
		if strings.TrimSpace(line) == "" {
			continue
		}
		fields := strings.Split(line, ",")
		if len(fields) >= 6 {
			nodes = append(nodes, Node{
				NodeID:   strings.TrimSpace(fields[1]), // Node ID
				Role:     strings.TrimSpace(fields[2]), // Roles
				Endpoint: strings.TrimSpace(fields[3]), // Endpoint
				Version:  strings.TrimSpace(fields[5]), // Version
			})
		}
	}

	// If no nodes were found, return an empty array
	if len(nodes) == 0 {
		logger.Printf("No nodes found in command output")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode([]Node{})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(nodes)
}

func getIndexes(w http.ResponseWriter, r *http.Request) {
	enableCORS(w, r)
	logger.Printf("Handling index list request from %s", r.RemoteAddr)

	// Prepare the command with --format 1 and --verbose for logging
	cmd := exec.Command("asvec", "index", "ls", "--format", "1", "--verbose")
	logger.Printf("Executing command: %s", cmd.String()) // Log the command

	// Capture output and error
	output, err := cmd.CombinedOutput() // This captures both stdout and stderr
	if err != nil {
		logger.Printf("Error executing index list command: %v", err)
		logger.Printf("%s", string(output)) // Log the output without prefix
		http.Error(w, "Failed to get indexes", http.StatusInternalServerError)
		return
	}

	// Log the command output with an extra newline
	logger.Printf("\n%s", string(output))

	// Parse CSV output
	lines := strings.Split(string(output), "\n")
	var indexes []IndexInfo

	// Skip first two lines (header rows)
	for _, line := range lines[2:] {
		if strings.TrimSpace(line) == "" {
			continue
		}

		fields := strings.Split(line, ",")
		if len(fields) >= 14 { // Ensure there are enough fields
			// Debugging output to check raw field values with their index numbers
			for i, field := range fields {
				logger.Printf("Field[%d]: %s", i, field)
			}

			// Parse parameters from the last field
			params := make(map[string]string)
			paramStr := fields[13]
			paramLines := strings.Split(paramStr, "\n")
			for _, param := range paramLines {
				parts := strings.SplitN(param, "\\,", 2)
				if len(parts) == 2 {
					params[strings.TrimSpace(parts[0])] = strings.TrimSpace(parts[1])
				}
			}

			// Parse labels
			labels := make(map[string]string)
			if fields[11] != "map[]" {
				labelStr := strings.Trim(fields[11], "map[]")
				labelPairs := strings.Split(labelStr, ",")
				for _, pair := range labelPairs {
					kv := strings.Split(pair, ":")
					if len(kv) == 2 {
						labels[strings.TrimSpace(kv[0])] = strings.TrimSpace(kv[1])
					}
				}
			}

			dimensions, _ := strconv.Atoi(fields[5])
			unmerged, _ := strconv.Atoi(fields[7])
			vectorRecords, _ := strconv.Atoi(fields[8])
			vertices, _ := strconv.Atoi(fields[12]) // Adjusted index for vertices

			// Log the parsed values with their index numbers
			logger.Printf("Parsed Index: Name=%s, Mode=%s, Status=%s, Unmerged=%d, UnmergedPercent=%s, Size=%s, VectorRecords=%d",
				fields[1], fields[10], fields[11], unmerged, fields[9], fields[8], vectorRecords)

			indexes = append(indexes, IndexInfo{
				Name:            fields[1],
				Namespace:       fields[2],
				Set:             fields[3],
				Field:           fields[4],
				Dimensions:      dimensions,
				DistanceMetric:  fields[6],
				Unmerged:        unmerged,
				VectorRecords:   vectorRecords,
				Size:            fields[9], // Ensure this is the correct field for size
				UnmergedPercent: fields[10], // Ensure this is the correct field for unmerged percent
				Mode:            fields[11], // Ensure this is the correct field for mode
				Status:          fields[12], // Ensure this is the correct field for status
				Vertices:        vertices,
				Labels:          labels,
				Storage:         fields[2],
				Parameters:      params,
			})
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(indexes)
}

func getUsers(w http.ResponseWriter, r *http.Request) {
	enableCORS(w, r)
	logger.Printf("Handling users request from %s", r.RemoteAddr)
	
	// Always set content type header first
	w.Header().Set("Content-Type", "application/json")
	
	cmd := exec.Command("asvec", "user", "ls")
	_, err := cmd.Output()
	
	if err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			stderr := string(exitErr.Stderr)
			logger.Printf("Command stderr: %s", stderr)
			
			if strings.Contains(stderr, "Unimplemented") {
				logger.Println("Users feature is unimplemented")
				if err := json.NewEncoder(w).Encode(map[string]interface{}{
					"error": "unimplemented",
					"available": false,
				}); err != nil {
					logger.Printf("Error encoding response: %v", err)
				}
				return
			}
		}
		logger.Printf("Error executing user command: %v", err)
		if err := json.NewEncoder(w).Encode(map[string]interface{}{
			"error": "failed to fetch users",
			"available": false,
		}); err != nil {
			logger.Printf("Error encoding response: %v", err)
		}
		return
	}
	
	if err := json.NewEncoder(w).Encode(map[string]interface{}{
		"available": true,
		"data": []interface{}{},
	}); err != nil {
		logger.Printf("Error encoding response: %v", err)
	}
}

func getRoles(w http.ResponseWriter, r *http.Request) {
	enableCORS(w, r)
	logger.Printf("Handling roles request from %s", r.RemoteAddr)
	
	// Always set content type header first
	w.Header().Set("Content-Type", "application/json")
	
	cmd := exec.Command("asvec", "role", "ls")
	_, err := cmd.Output()
	
	if err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			stderr := string(exitErr.Stderr)
			logger.Printf("Command stderr: %s", stderr)
			
			if strings.Contains(stderr, "Unimplemented") {
				logger.Println("Roles feature is unimplemented")
				if err := json.NewEncoder(w).Encode(map[string]interface{}{
					"error": "unimplemented",
					"available": false,
				}); err != nil {
					logger.Printf("Error encoding response: %v", err)
				}
				return
			}
		}
		logger.Printf("Error executing role command: %v", err)
		if err := json.NewEncoder(w).Encode(map[string]interface{}{
			"error": "failed to fetch roles",
			"available": false,
		}); err != nil {
			logger.Printf("Error encoding response: %v", err)
		}
		return
	}
	
	if err := json.NewEncoder(w).Encode(map[string]interface{}{
		"available": true,
		"data": []interface{}{},
	}); err != nil {
		logger.Printf("Error encoding response: %v", err)
	}
}

func getClusterInfo(w http.ResponseWriter, r *http.Request) {
	enableCORS(w, r)
	logger.Printf("Handling cluster info request from %s", r.RemoteAddr)

	// Prepare the command without --format 1 and --verbose for logging
	cmd := exec.Command("asvec", "node", "ls")
	logger.Printf("Executing command: %s", cmd.String()) // Log the command

	// Capture output and error
	output, err := cmd.CombinedOutput() // This captures both stdout and stderr
	if err != nil {
		logger.Printf("Error executing node list command: %v", err)
		logger.Printf("%s", string(output)) // Log the output
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"error": "Failed to get cluster info",
			"clusterSize": 0,
			"nodeRoles": []string{},
			"version": "Unknown",
			"totalVectors": 0,
		})
		return
	}

	// Log the command output
	logger.Printf("%s", string(output))

	// Parse node list output
	lines := strings.Split(string(output), "\n")
	var nodes []Node
	var versions = make(map[string]bool)
	var roles []string

	// Skip header lines (first two lines)
	for _, line := range lines[2:] {
		if strings.TrimSpace(line) == "" {
			continue
		}
		fields := strings.Split(line, ",")
		if len(fields) >= 6 {
			version := strings.TrimSpace(fields[5])
			if version != "" {
				versions[version] = true
			}
			role := strings.TrimSpace(fields[2])
			if role != "" {
				roles = append(roles, role)
			}
			nodes = append(nodes, Node{
				NodeID:   strings.TrimSpace(fields[1]),
				Role:     role,
				Endpoint: strings.TrimSpace(fields[3]),
				Version:  version,
			})
		}
	}

	// Determine cluster version
	var version string
	if len(versions) == 0 {
		version = "Unknown"
	} else if len(versions) == 1 {
		for v := range versions {
			version = v
		}
	} else {
		version = "MIXED"
		logger.Printf("Mixed versions detected: %v", versions)
	}

	// Get total vectors (if available)
	totalVectors := 0
	cmd = exec.Command("asvec", "cluster", "info")
	logger.Printf("Executing command: %s", cmd.String()) // Log the command

	output, err = cmd.CombinedOutput() // Capture output and error
	if err == nil {
		var clusterInfo struct {
			TotalVectors int `json:"totalVectors"`
		}
		if err := json.Unmarshal(output, &clusterInfo); err == nil {
			totalVectors = clusterInfo.TotalVectors
		}
	}

	// Send response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"clusterSize": len(nodes),
		"nodeRoles": roles,
		"version": version,
		"totalVectors": totalVectors,
	})
}

func executeQuery(w http.ResponseWriter, r *http.Request) {
	enableCORS(w, r)
	logger.Printf("Handling query request from %s", r.RemoteAddr)
	
	if r.Method != "POST" {
		logger.Printf("Invalid method %s for query endpoint", r.Method)
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	
	// Parse the query parameters from request body
	var queryParams struct {
		Index string    `json:"index"`
		Query []float64 `json:"query"`
		Limit int       `json:"limit"`
	}
	
	if err := json.NewDecoder(r.Body).Decode(&queryParams); err != nil {
		logger.Printf("Failed to parse query parameters: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	
	logger.Printf("Executing query on index '%s' with limit %d", 
		queryParams.Index, queryParams.Limit)
	
	// Execute asvec query command
	queryCmd := fmt.Sprintf("asvec query -i %s -k %d", queryParams.Index, queryParams.Limit)
	logger.Printf("Executing: %s", queryCmd)
	cmd := exec.Command("sh", "-c", queryCmd)
	output, err := cmd.Output()
	if err != nil {
		logger.Printf("Error executing query command: %v", err)
		if exitErr, ok := err.(*exec.ExitError); ok {
			logger.Printf("Command stderr: %s", string(exitErr.Stderr))
		}
		http.Error(w, "Query execution failed", http.StatusInternalServerError)
		return
	}
	
	logger.Printf("Raw query output: %s", string(output))
	
	// Parse the JSON output from asvec
	var results []QueryResult
	if err := json.Unmarshal(output, &results); err != nil {
		logger.Printf("Failed to parse query results: %v", err)
		http.Error(w, "Failed to parse query results", http.StatusInternalServerError)
		return
	}
	
	logger.Printf("Query returned %d results", len(results))

	// Fix the response struct definition
	response := struct {
		Results       []QueryResult `json:"results"`
		ExecutionTime float64       `json:"executionTime"`
	}{
		Results:       results,
		ExecutionTime: 0.023,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func getConfig(w http.ResponseWriter, r *http.Request) {
	enableCORS(w, r)
	logger.Printf("Handling config request from %s", r.RemoteAddr)
	
	w.Header().Set("Content-Type", "application/json")
	
	// Check if asvec is installed
	_, err := exec.LookPath("asvec")
	asvecInstalled := err == nil
	
	// Try to read the config file
	configPath := "/etc/aerospike/asvec.yml"
	host := ""
	seeds := ""
	
	if content, err := os.ReadFile(configPath); err == nil {
		// Parse YAML to extract host and seeds
		var yamlConfig map[string]interface{}
		if err := yaml.Unmarshal(content, &yamlConfig); err == nil {
			logger.Printf("Parsed YAML config: %+v", yamlConfig)
			
			if defaultConfig, ok := yamlConfig["default"].(map[string]interface{}); ok {
				// Check if host is not commented out
				if h, ok := defaultConfig["host"].(string); ok && h != "" {
					host = h
					logger.Printf("Found host configuration: %s", host)
				}
				
				// Check if seeds is not commented out
				if s, ok := defaultConfig["seeds"].(string); ok && s != "" {
					seeds = s
					logger.Printf("Found seeds configuration: %s", seeds)
				}
			}
		} else {
			logger.Printf("Failed to parse YAML: %v", err)
		}
	} else {
		logger.Printf("Failed to read config file: %v", err)
	}
	
	configInfo := ConfigInfo{
		ConfigFile:    configPath,
		Host:         host,
		Seeds:        seeds,
		CLIInstalled: asvecInstalled,
		CLIVersion:   "",
		CLIDownloadURL: "https://github.com/aerospike/asvec",
	}
	
	// If asvec is installed, get its version
	if asvecInstalled {
		cmd := exec.Command("asvec", "--version")
		if output, err := cmd.Output(); err == nil {
			configInfo.CLIVersion = strings.TrimSpace(string(output))
		}
	}
	
	logger.Printf("Sending config info: %+v", configInfo)
	json.NewEncoder(w).Encode(configInfo)
}