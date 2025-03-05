$apiKey = "rnd_OTq0bxnl53bVpaAnU2qxYu5CdVNK"
$serviceName = "quantum-grid-neon-legacy"
$headers = @{
    Authorization = "Bearer $apiKey"
}

try {
    # First get the service ID
    $servicesResponse = Invoke-RestMethod -Method GET -Uri "https://api.render.com/v1/services" -Headers $headers
    $serviceId = ($servicesResponse | Where-Object { $_.service.name -eq $serviceName }).service.id
    
    if (-not $serviceId) {
        Write-Error "Service '$serviceName' not found"
        exit 1
    }
    
    # Now trigger a deploy with the service ID
    $uri = "https://api.render.com/v1/services/$serviceId/deploys"
    $response = Invoke-RestMethod -Method POST -Uri $uri -Headers $headers
    
    Write-Output "Deployment triggered successfully for $serviceName (ID: $serviceId)"
    Write-Output $response
} catch {
    Write-Error "Deployment failed: $_"
} 