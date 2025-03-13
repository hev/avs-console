import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { ExternalLink, AlertCircle, CheckCircle2 } from "lucide-react"
import { fetchConfig } from "@/lib/api"
import Link from "next/link"

export default async function ConfigurationPage() {
    const config = await fetchConfig()
    
    return (
        <div className="container mx-auto p-4 space-y-4">
            <h1 className="text-2xl font-bold mb-4">Configuration</h1>
            
            {/* CLI Installation Status */}
            <Card>
                <CardHeader>
                    <CardTitle>CLI Installation</CardTitle>
                    <CardDescription>
                        The Aerospike Vector Search Console requires the asvec CLI tool
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert variant={config.cliInstalled ? "default" : "destructive"}>
                        <div className="flex items-center gap-2">
                            {config.cliInstalled ? (
                                <CheckCircle2 className="h-4 w-4" />
                            ) : (
                                <AlertCircle className="h-4 w-4" />
                            )}
                            <AlertTitle>
                                {config.cliInstalled ? "CLI Installed" : "CLI Not Found"}
                            </AlertTitle>
                        </div>
                        <AlertDescription>
                            {config.cliInstalled ? (
                                `Version: ${config.cliVersion}`
                            ) : (
                                <div className="mt-2">
                                    <p>Please install the asvec CLI tool to use this console.</p>
                                    <Button variant="link" asChild className="p-0">
                                        <Link href={config.cliDownloadUrl} target="_blank">
                                            Download from GitHub <ExternalLink className="ml-1 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>

            {/* Configuration File */}
            <Card>
                <CardHeader>
                    <CardTitle>Configuration File</CardTitle>
                    <CardDescription>
                        The configuration file should be located at /etc/aerospike/asvec.yml
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert>
                        <AlertTitle>Configuration Example</AlertTitle>
                        <AlertDescription>
                            <pre className="mt-2 p-4 bg-secondary rounded-md overflow-x-auto">
                                {`default:
  # Host address of the Aerospike server
  host: 127.0.0.1:5000              # Use host when using a load-balancer
  # seeds: 1.1.1.1:5000,2.2.2.2:5000  # Use seeds when not using a load-balancer
  
  # Credentials for authentication
  credentials: admin:admin

  # TLS Configuration (optional)
  # tls-cafile: ./ca.crt
  # tls-certfile: ./cert.crt
  # tls-keyfile: ./key.key`}
                            </pre>
                        </AlertDescription>
                    </Alert>

                    {config.configText && (
                        <Alert>
                            <AlertTitle>Current Configuration</AlertTitle>
                            <AlertDescription>
                                <pre className="mt-2 p-4 bg-secondary rounded-md overflow-x-auto">
                                    {config.configText}
                                </pre>
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {/* Connection Status */}
            <Card>
                <CardHeader>
                    <CardTitle>Connection Status</CardTitle>
                    <CardDescription>
                        Current connection details for your Aerospike cluster
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <dl className="space-y-2">
                        <div>
                            <dt className="font-medium">Active Cluster:</dt>
                            <dd>{config.activeCluster}</dd>
                        </div>
                        <div>
                            <dt className="font-medium">Host:</dt>
                            <dd>{config.host}</dd>
                        </div>
                        <div>
                            <dt className="font-medium">TLS Enabled:</dt>
                            <dd>{config.tlsEnabled ? "Yes" : "No"}</dd>
                        </div>
                    </dl>
                </CardContent>
            </Card>
        </div>
    )
} 