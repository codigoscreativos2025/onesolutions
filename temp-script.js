const fs = require('fs');

const replacement = `export function metalRoofIsoHtml(data: Record<string, string>): string {
  const d = (k: string) => data[k] || "";
  const imgTag = (src: string) => \`<img src="\${src}" class="max-h-[40px]" style="max-height: 40px;" alt="Signature" />\`;

  return \`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Metal Roof With ISO Tapered Contract - One Solutions</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <style>

    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');
    
    :root {
        --brand: #f1853b;
        --dark: #18181b;
        --lightbg: #ffffff;
    }
    
    body {
        font-family: 'Montserrat', sans-serif;
        background-color: #f3f4f6;
        margin: 0;
        padding: 40px 0;
        display: flex;
        justify-content: center;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }
    
    .page-container {
        background-color: var(--lightbg);
        width: 100%;
        max-width: 210mm;
        min-height: 297mm;
        position: relative;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }
    
    header {
        position: relative;
        width: 100%;
        height: 140px;
    }
    
    .top-left-shape {
        position: absolute;
        top: 0;
        left: 0;
        width: 280px;
        height: 80px;
        z-index: 0;
    }
    
    .black-line {
        position: absolute;
        top: 50px;
        left: 90px;
        right: 140px;
        height: 8px;
        background-color: var(--dark);
        border-top-right-radius: 9999px;
        border-bottom-right-radius: 9999px;
        z-index: 0;
    }
    
    .quote-valid {
        position: absolute;
        top: 32px;
        left: 300px;
        z-index: 20;
        color: #555;
        font-style: italic;
        font-size: 10px;
        font-weight: 400;
        letter-spacing: 0.05em;
    }
    
    .pill-container {
        position: absolute;
        top: 32px;
        left: 90px;
        z-index: 20;
        border-radius: 9999px;
        padding: 4px;
        background-color: white;
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    }
    
    .pill-inner {
        background-color: #262626;
        color: white;
        font-weight: 700;
        border-radius: 9999px;
        padding: 12px 16px;
        font-size: 10px;
        letter-spacing: 0.025em;
    }
    
    .top-right-shape {
        position: absolute;
        top: 8px;
        right: 0;
        width: 180px;
        height: 60px;
        z-index: 0;
    }
    
    .logo-container {
        position: absolute;
        top: 8px;
        right: 70px;
        z-index: 30;
        background-color: white;
        border-radius: 9999px;
        padding: 4px;
    }
    
    .logo-container img {
        height: 128px;
        object-fit: contain;
    }
    
    .title-h1 {
        position: absolute;
        top: 105px;
        left: 105px;
        z-index: 30;
        font-size: 16px;
        font-weight: 900;
        letter-spacing: 0.025em;
        margin: 0;
    }
    
    .text-brand { color: var(--brand); }
    .text-dark { color: var(--dark); }
    
    main {
        padding: 32px 48px;
        flex-grow: 1;
        margin-bottom: 30px;
    }
    
    .section-row {
        display: flex;
        gap: 15px;
        margin-bottom: 20px;
    }
    
    .icon-col {
        flex-shrink: 0;
        width: 40px;
        display: flex;
        justify-content: center;
        margin-top: 4px;
    }
    
    .content-col {
        flex-grow: 1;
    }
    
    .section-title {
        font-size: 12px;
        font-weight: 700;
        color: var(--brand);
        margin: 0 0 12px 0;
        text-transform: uppercase;
    }
    
    .content-list {
        list-style-type: disc;
        padding-left: 20px;
        margin: 0;
        font-size: 12px;
        color: #1f2937;
        font-weight: 500;
    }
    
    .content-list li {
        margin-bottom: 6px;
    }
    
    .content-list li::marker {
        color: #363636;
        font-size: 0.8em;
    }
    
    .content-list .no-bullet {
        list-style-type: none;
        margin-left: -20px;
        margin-top: 8px;
        margin-bottom: 4px;
    }
    
    .content-text {
        font-size: 12px;
        color: #1f2937;
        font-weight: 500;
        text-transform: uppercase;
        margin: 2px 0 0 0;
        line-height: 1.6;
    }
    
    .icon-circle-border {
        border: 2px solid var(--brand);
        border-radius: 9999px;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--brand);
    }
    
    .footer-box {
        padding: 0 48px;
        margin-top: auto;
        margin-bottom: 30px;
        position: relative;
        z-index: 30;
    }
    
    .signature-container {
        border: 3px solid var(--brand);
        border-radius: 32px;
        border-bottom-left-radius: 0;
        border-bottom-right-radius: 0;
        border-bottom: 0;
        padding: 20px 40px 0 40px;
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
    }
    
    .sig-col {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 220px;
    }
    
    .sig-title {
        font-weight: 700;
        font-size: 17px;
        margin: 0 0 32px 0;
        text-transform: uppercase;
    }
    
    .sig-line {
        border-bottom: 2px solid black;
        width: 100%;
        margin-bottom: 4px;
        min-height: 30px;
        display: flex;
        justify-content: center;
    }
    
    .sig-label {
        text-align: center;
        font-weight: 700;
        font-size: 12px;
        margin-bottom: 24px;
    }
    
    .date-label {
        text-align: center;
        font-weight: 700;
        font-size: 12px;
    }
    
    .footer-logo {
        height: 120px;
        object-fit: contain;
        margin-top: -32px;
    }
    
    .bottom-line-left {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 50%;
        height: 8px;
        background-color: var(--brand);
        border-top-right-radius: 9999px;
        border-bottom-right-radius: 9999px;
        z-index: 10;
    }
    
    .bottom-line-right {
        position: absolute;
        bottom: 0;
        right: 0;
        width: 75%;
        height: 3px;
        background-color: var(--dark);
        border-top-left-radius: 9999px;
        border-bottom-left-radius: 9999px;
        z-index: 20;
    }

    </style>
</head>
<body>
    <div class="page-container">
        <header>
            <div class="top-left-shape">
                <svg viewBox="0 0 420 115" style="width:100%; height:100%;">
                    <path d="M 0 0 L 330 0 C 400 0, 410 90, 360 115 L 0 115 Z" fill="#f1853b" />
                    <g stroke="#18181b" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M 0 25 L 50 25 L 90 55 L 170 55" />
                        <circle cx="170" cy="55" r="3" fill="#18181b" />
                        
                        <path d="M 0 45 L 30 45 L 70 15 L 130 15" />
                        <circle cx="130" cy="15" r="3" fill="#18181b" />
                        
                        <path d="M 0 95 L 140 95" />
                        <circle cx="140" cy="95" r="3" fill="#18181b" />
                    </g>
                </svg>
            </div>

            <div class="black-line"></div>

            <div class="quote-valid">
                QUOTE VALID FOR SEVEN (07) DAYS
            </div>

            <div class="pill-container">
                <div class="pill-inner">
                    ONESOLUTIONS COMPANIES LLC
                </div>
            </div>

            <div class="top-right-shape">
                <svg viewBox="0 0 180 60" style="width:100%; height:100%;">
                    <g stroke="#f1853b" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M 150 10 L 180 10" />
                        <circle cx="150" cy="10" r="3" fill="#f1853b" />
                        
                        <path d="M 150 25 L 180 25" />
                        <circle cx="150" cy="25" r="3" fill="#f1853b" />
                        
                        <path d="M 120 40 L 180 40" />
                        <circle cx="120" cy="40" r="3" fill="#f1853b" />
                    </g>
                </svg>
            </div>

            <div class="logo-container">
                <img src="/logo-company.png" alt="One Solutions Logo" onerror="this.style.display='none'">
            </div>
            
            <h1 class="title-h1">
                <span class="text-brand">METAL ROOF WITH ISO TAPERED</span> <span class="text-dark">CONTRACT</span>
            </h1>
        </header>

        <main>
            <div class="section-row">
                <div class="icon-col">
                    <i class="fa-solid fa-clipboard-list text-brand" style="font-size:32px;"></i>
                </div>
                <div class="content-col">
                    <h2 class="section-title">PERMITS AND INSPECTIONS</h2>
                    <ul class="content-list">
                        <li>The Roofing Factory will obtain and schedule all necessary permits and inspections.</li>
                        <li class="no-bullet"><strong>Roof Removal and Decking</strong></li>
                        <li>Remove one layer of existing roof and underlayment to expose decking.</li>
                        <li>Replace any rotten wood and rusty metal to meet code requirements (Not Painted). SEE PRICE DETAILS BELOW.</li>
                        <li>Re-nail entire decking to code to meet code specifications.</li>
                        <li class="no-bullet"><strong>Roof Installation</strong></li>
                        <li>Install thermal value Energy-Guard Tapered Poly-Iso Insulation Panels. Ideal for providing slope to a low-slope roof in order to allow the water to drain properly. Only on the section of the flat roof that does not have a slope.</li>
                        <li>Install one Layer of Owens Corning DeckSeal Self-Adhered Base (Roof System Underlayment) as a dry in application per 2023 FL BLDG Code.</li>
                        <li>Install one layer of POLYGLASS POLYSTICK underlayment as a dry in application per 2021 FL BLDG Code.</li>
                        <li>Install valley metal in all valleys.</li>
                        <li>Install 2½ in. drip edge around perimeter of the roof. COLOR: \${d("color")}</li>
                        <li>Install new (\${d("new2InLeadBoots")}) 2 in. & (\${d("new3InLeadBoots")}) 3 in. lead boots.</li>
                        <li>Install (\${d("newExhaustVents")}) new exhaust vents.</li>
                        <li>Install (\${d("newRidgeVentsFt")} ft) new ridge vents.</li>
                        <li>Install standing seam (hidden screws) click-lock metal panels &ndash; 26 ga. With Striations. (Galvalume with standard coating).</li>
                        <li>Secure Metal Panels to the roof deck with the proper fasteners along the screw flange using pancake screw.</li>
                        <li>Install one Layer of Owens Corning DeckSeal, Self-Adhered Roofing System (CAP SHEET).</li>
                        <li>Remove all debris and dispose of it properly.</li>
                        <li>Conduct a magnetic sweep of the yard and driveway.</li>
                        <li>The price includes the specified roofing materials, the cost of the specified labor, taxes, and permits fees (if applicable).</li>
                    </ul>
                </div>
            </div>

            <div class="section-row">
                <div class="icon-col">
                    <i class="fa-regular fa-circle-check text-brand" style="font-size:24px;"></i>
                </div>
                <div class="content-col">
                    <h2 class="section-title">WARRANTY</h2>
                    <p class="content-text">
                        MATERIAL WARRANTY AS PROVIDED BY MANUFACTURER: THIRTY (30) YEARS ON METAL, FIFTEEN (15) YEARS ON CAP SHEET, AND FIVE (5) YEARS ON WORKMANSHIP FROM FINAL PAYMENT.
                    </p>
                </div>
            </div>

            <div class="section-row">
                <div class="icon-col">
                    <i class="fa-solid fa-ban text-brand" style="font-size:24px;"></i>
                </div>
                <div class="content-col">
                    <h2 class="section-title">EXCLUSIONS</h2>
                    <ul class="content-list">
                        <li>Does not include stucco, siding or painting repair work where deteriorated L-flashing had to be replaced.</li>
                        <li>Does not include solar panels, gutters, or skylights. Unless otherwise stipulated, we will detach and reset existing skylights and/or gutters.</li>
                    </ul>
                </div>
            </div>

            <div class="section-row">
                <div class="icon-col">
                    <div class="icon-circle-border">
                         <i class="fa-solid fa-dollar-sign" style="font-size:12px; font-weight:bold;"></i>
                    </div>
                </div>
                <div class="content-col">
                    <h2 class="section-title">ADDITIONAL CHARGES</h2>
                    <ul class="content-list" style="text-transform:uppercase;">
                        <li>ADDITIONAL LAYERS OF SHINGLE WILL COST $30/SQ IF FOUND DURING REMOVAL.</li>
                        <li>ALL ROTTED WOODWORK IS ADDITIONAL $95.00 PER SHEET OF PLYWOOD.</li>
                        <li>1X2 / 2X4 $5.15 LF.</li>
                        <li>1X6 / 1X8 / 1X10 / 1X12 $9.70 LF.</li>
                        <li>IF CEDAR WOOD $12.50 LF.</li>
                        <li>ALL ROTTED METALWORK IS ADDITIONAL FLASHING $18.00/LF AND COUNTER FLASHING $18.00/LF.</li>
                    </ul>
                </div>
            </div>

            <div class="section-row">
                <div class="icon-col">
                    <i class="fa-regular fa-circle-user text-brand" style="font-size:24px;"></i>
                </div>
                <div class="content-col">
                    <h2 class="section-title">HOMEOWNER RESPONSIBILITIES</h2>
                    <p class="content-text">
                        (PLEASE BE AWARE THAT THE HOMEOWNER IS RESPONSIBLE FOR MAKING THE PROPER ARRANGEMENTS TO BE HOME DURING THE ROOFING JOB. WE MUST REPLACE ALL THE NECESSARY WOODWORK WITH SIMILAR MATERIALS AT THE QUOTED PRICES AS THE DECKING CANNOT BE LEFT EXPOSED DUE TO THE RISK FOR WATER INTRUSION.)
                    </p>
                </div>
            </div>

            <div class="section-row">
                <div class="icon-col">
                    <i class="fa-solid fa-file-invoice-dollar text-brand" style="font-size:24px;"></i>
                </div>
                <div class="content-col">
                    <h2 class="section-title">PAYMENT TERMS</h2>
                    <p class="content-text">
                        PAYMENT TERMS: 50% DEPOSIT SIGNING THE CONTRACT & THE BALANCE DUE UPON JOB.
                    </p>
                </div>
            </div>
        </main>

        <div class="footer-box">
            <div class="signature-container">
                
                <div class="sig-col">
                    <h3 class="sig-title"><span class="text-dark">THE</span> <span class="text-brand">COMPANY</span></h3>
                    <div style="width:100%;">
                        \${d("companySignature") ? \`<div class="sig-line">\${imgTag(d("companySignature"))}</div>\` : \`<div class="sig-line"></div>\`}
                        <div class="sig-label">SIGNATURE</div>
                        \${d("companyDate") ? \`<div class="sig-line" style="font-weight:700; font-size:14px; min-height:20px; align-items:flex-end; padding-bottom:2px;">\${d("companyDate")}</div>\` : \`<div class="sig-line" style="min-height:20px;"></div>\`}
                        <div class="date-label">DATE</div>
                    </div>
                </div>
                
                <div>
                    <img src="/logo-company-footer.png" class="footer-logo" alt="Icon" onerror="this.style.display='none'">
                </div>
                
                <div class="sig-col">
                    <h3 class="sig-title"><span class="text-dark">THE</span> <span class="text-brand">REPRESENTATIVE</span></h3>
                    <div style="width:100%;">
                        \${d("representativeSignature") ? \`<div class="sig-line">\${imgTag(d("representativeSignature"))}</div>\` : \`<div class="sig-line"></div>\`}
                        <div class="sig-label">SIGNATURE</div>
                        \${d("representativeDate") ? \`<div class="sig-line" style="font-weight:700; font-size:14px; min-height:20px; align-items:flex-end; padding-bottom:2px;">\${d("representativeDate")}</div>\` : \`<div class="sig-line" style="min-height:20px;"></div>\`}
                        <div class="date-label">DATE</div>
                    </div>
                </div>
                
            </div>
        </div>
        
        <div class="bottom-line-left"></div>
        <div class="bottom-line-right"></div>
        
    </div>
</body>
</html>\`;
}
`

let code = fs.readFileSync('lib/contract-templates.ts', 'utf8');

const startStr = 'export function metalRoofIsoHtml(';
const endStr = 'export const metalRoofIsoFields';

const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
    code = code.substring(0, startIndex) + replacement + '\n\n' + code.substring(endIndex);
    fs.writeFileSync('lib/contract-templates.ts', code);
    fs.writeFileSync('C:/Users/hende/.gemini/antigravity/brain/09ff160b-200c-45d2-9626-562b1650d7ca/scratch/metalRoofIso.ts', 'export interface ContractField {\\n  id: string;\\n  name: string;\\n  type: "text" | "date" | "signature" | "number";\\n}\\n\\nexport const metalRoofIsoFields: ContractField[] = [\\n  { id: "color", name: "Color", type: "text" },\\n  { id: "new2InLeadBoots", name: "New 2 in. Lead Boots", type: "text" },\\n  { id: "new3InLeadBoots", name: "New 3 in. Lead Boots", type: "text" },\\n  { id: "newExhaustVents", name: "New Exhaust Vents", type: "text" },\\n  { id: "newRidgeVentsFt", name: "New Ridge Vents (ft)", type: "text" },\\n  { id: "companySignature", name: "Company Signature", type: "signature" },\\n  { id: "companyDate", name: "Company Date", type: "date" },\\n  { id: "representativeSignature", name: "Representative Signature", type: "signature" },\\n  { id: "representativeDate", name: "Representative Date", type: "date" }\\n];\\n\\n' + replacement);
}
