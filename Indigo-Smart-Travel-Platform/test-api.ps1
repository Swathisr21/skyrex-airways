# Test script for flight search API
$source = "Bangalore"
$destination = "Hyderabad"
$travelDate = "2026-04-20"

Write-Host "Testing flight search API..."
Write-Host "URL: http://localhost:8080/flights?source=$source&destination=$destination&travelDate=$travelDate"

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/flights?source=$source&destination=$destination&travelDate=$travelDate" -Method Get -UseBasicParsing
    Write-Host "Response:"
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $_"
}