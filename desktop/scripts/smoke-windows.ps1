# GitHub's Windows runner is elevated. PostgreSQL must run as a standard user.
$ErrorActionPreference = 'Stop'
$smokeUser = 'gitclaw-smoke'
$smokePassword = ConvertTo-SecureString ([guid]::NewGuid().ToString() + '!Aa1') -AsPlainText -Force
$smokeAccount = "$env:COMPUTERNAME\$smokeUser"
$smokeCredential = [pscredential]::new($smokeAccount, $smokePassword)
$workspace = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$output = Join-Path $workspace 'release/desktop'
$smokeTemp = Join-Path $output 'smoke-temp'
$stdout = Join-Path $env:RUNNER_TEMP 'gitclaw-smoke.stdout.log'
$stderr = Join-Path $env:RUNNER_TEMP 'gitclaw-smoke.stderr.log'

New-LocalUser -Name $smokeUser -Password $smokePassword -PasswordNeverExpires | Out-Null
try {
  Add-LocalGroupMember -SID 'S-1-5-32-545' -Member $smokeUser
  New-Item -ItemType Directory -Path $smokeTemp -Force | Out-Null
  & icacls $output /grant "${smokeAccount}:(OI)(CI)M" /T /Q | Out-Null
  if ($LASTEXITCODE -ne 0) { throw 'Could not grant access to the smoke-test output directory.' }
  $smokeScript = Join-Path $PSScriptRoot 'smoke-desktop.mjs'
  $smokeProcess = Start-Process -FilePath (Get-Command node).Source `
    -ArgumentList "`"$smokeScript`"" -WorkingDirectory $workspace `
    -Credential $smokeCredential -LoadUserProfile -WindowStyle Hidden `
    -Environment @{ TEMP = $smokeTemp; TMP = $smokeTemp } `
    -RedirectStandardOutput $stdout -RedirectStandardError $stderr -PassThru -Wait
  Get-Content -LiteralPath $stdout -ErrorAction SilentlyContinue
  Get-Content -LiteralPath $stderr -ErrorAction SilentlyContinue
  if ($smokeProcess.ExitCode -ne 0) { throw "Windows smoke test failed with exit code $($smokeProcess.ExitCode)." }
} finally {
  Remove-LocalUser -Name $smokeUser
}
