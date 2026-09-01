$content = Get-Content 'components/layout/TopAppBar.tsx' -Raw
$content = $content -replace 'import \{ LanguageSwitcher \} from "./LanguageSwitcher";', "import { LanguageSwitcher } from `"./LanguageSwitcher`";`nimport { CalculatorModal } from `"@/components/ui/CalculatorModal`";"
$content = $content -replace '<LanguageSwitcher />', "{role !== `"PARTNER`" && <CalculatorModal />}`n        <LanguageSwitcher />"
Set-Content 'components/layout/TopAppBar.tsx' -Value $content
Write-Host "Replaced!"
