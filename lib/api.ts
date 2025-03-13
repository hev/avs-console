// API client for interacting with the Go backend

// Types
export interface Node {
  id: number
  nodeId: string
  role: string
  endpoint: string
  version: string
  status: {
    connected: boolean
    message: string
  }
}

export interface Index {
  name: string
  dimensions: number
  metric: string
  mode: string
  status: string
  vectorCount: number
  unmerged: number
}

export interface User {
  username: string
  roles: string[]
}

export interface Role {
  name: string
  description: string
}

export interface ClusterInfo {
  clusterId: string
  version: string
  clusterSize: number
  totalVectors: number
  nodeRoles: string[]
  activeCluster: string
}

export interface QueryResult {
  id: string
  similarity: number
  metadata: string
}

export interface QueryResponse {
  results: QueryResult[]
  executionTime: number
}

export interface ConfigInfo {
  configFile: string
  activeCluster: string
  host: string
  credentials: string
  tlsEnabled: boolean
  configText: string
}

export interface ApiResponse<T> {
  data?: T
  error?: string
  loading: boolean
}

interface FeatureResponse<T> {
    data?: T;
    error?: string;
    available: boolean;
}

// API URL
const API_BASE_URL = 'http://localhost:8080/api';

// Helper function to check if server is available
async function checkServerHealth(): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        return response.ok;
    } catch (error) {
        console.error('Server health check failed:', error);
        return false;
    }
}

// API functions
export async function fetchNodes(): Promise<Node[]> {
    try {
        console.log('Fetching nodes from:', `${API_BASE_URL}/nodes`);
        const response = await fetch(`${API_BASE_URL}/nodes`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const text = await response.text();
        console.log('Raw response:', text);

        if (!text) {
            console.warn('Empty response from server');
            return [];
        }

        const data = JSON.parse(text);
        console.log('Parsed nodes:', data);
        return data;
    } catch (error) {
        console.error('Error fetching nodes:', error);
        // Return empty array or mock data as fallback
        return [{
            id: 1,
            nodeId: "LB",
            role: "N/A",
            endpoint: "127.0.0.1:5555",
            version: "1.1.0-RC",
            status: {
                connected: true,
                message: "Error fetching nodes"
            }
        }];
    }
}

export async function fetchIndexes(): Promise<Index[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/indexes`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching indexes:', error);
    throw error;
  }
}

export async function fetchUsers(): Promise<FeatureResponse<User[]>> {
    try {
        const response = await fetch(`${API_BASE_URL}/users`);
        console.log('Users response status:', response.status);
        
        const text = await response.text();
        console.log('Users raw response:', text);
        
        if (!text) {
            console.warn('Empty response from users endpoint');
            return { available: false, error: 'Empty response' };
        }
        
        const data = JSON.parse(text);
        console.log('Users parsed response:', data);
        
        return {
            available: data.available ?? false,
            data: data.data,
            error: data.error
        };
    } catch (error) {
        console.error('Error fetching users:', error);
        return { available: false, error: error.message };
    }
}

export async function fetchRoles(): Promise<FeatureResponse<Role[]>> {
    try {
        const response = await fetch(`${API_BASE_URL}/roles`);
        console.log('Roles response status:', response.status);
        
        const text = await response.text();
        console.log('Roles raw response:', text);
        
        if (!text) {
            console.warn('Empty response from roles endpoint');
            return { available: false, error: 'Empty response' };
        }
        
        const data = JSON.parse(text);
        console.log('Roles parsed response:', data);
        
        return {
            available: data.available ?? false,
            data: data.data,
            error: data.error
        };
    } catch (error) {
        console.error('Error fetching roles:', error);
        return { available: false, error: error.message };
    }
}

export async function fetchClusterInfo(): Promise<ClusterInfo> {
    try {
        // Check server health first
        const isServerHealthy = await checkServerHealth();
        if (!isServerHealthy) {
            console.warn('Server is not responding, using default data');
            return {
                clusterId: "default-cluster",
                version: "AVS 1.1.0-RC1",
                clusterSize: 1,
                totalVectors: 0,
                nodeRoles: ["STANDALONE"],
                activeCluster: "default"
            };
        }

        const response = await fetch(`${API_BASE_URL}/cluster/info`);
        
        // Log the raw response for debugging
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        const text = await response.text();
        console.log('Raw response text:', text);

        if (!text) {
            console.error('Empty response from server');
            throw new Error('Empty response from server');
        }

        try {
            return JSON.parse(text);
        } catch (parseError) {
            console.error('Failed to parse JSON:', parseError);
            console.error('Raw response:', text);
            throw new Error('Invalid JSON response from server');
        }
    } catch (error) {
        console.error('Error fetching cluster info:', error);
        // Return default data when server fails
        return {
            clusterId: "default-cluster",
            version: "AVS 1.1.0-RC1",
            clusterSize: 1,
            totalVectors: 0,
            nodeRoles: ["STANDALONE"],
            activeCluster: "default"
        };
    }
}

export async function executeQuery(queryData: any): Promise<QueryResponse> {
  const response = await fetch(`${API_BASE_URL}/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(queryData),
  })

  if (!response.ok) {
    throw new Error(`Failed to execute query: ${response.statusText}`)
  }

  return response.json()
}

export async function fetchConfig(): Promise<ConfigInfo> {
  const response = await fetch(`${API_BASE_URL}/config`)
  if (!response.ok) {
    throw new Error(`Failed to fetch config: ${response.statusText}`)
  }
  return response.json()
}

export async function updateConfig(configData: Partial<ConfigInfo>): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/config/update`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(configData),
  })

  if (!response.ok) {
    throw new Error(`Failed to update config: ${response.statusText}`)
  }

  return response.json()
}

export async function uploadTLSFile(
  fileType: string,
  file: File,
): Promise<{ success: boolean; message: string; type: string }> {
  const formData = new FormData()
  formData.append("type", fileType)
  formData.append("file", file)

  const response = await fetch(`${API_BASE_URL}/config/upload`, {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`Failed to upload file: ${response.statusText}`)
  }

  return response.json()
}

