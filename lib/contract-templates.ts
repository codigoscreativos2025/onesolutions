export interface ContractField {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "money" | "signature";
  defaultValue?: string;
}

export interface ContractTemplate {
  projectType: string;
  name: string;
  html: (data: Record<string, string>) => string;
  fields: ContractField[];
}

function imgTag(dataUrl: string): string {
  if (!dataUrl) return "";
  return `<img src="${dataUrl}" alt="Signature" style="max-width:100%;height:35px;object-fit:contain;" />`;
}

function textOrLine(value: string): string {
  if (!value) return '<div class="line"></div>';
  return `<span style="font-weight:600;font-size:14px;">${value}</span>`;
}

function techoHtml(data: Record<string, string>): string {
  const d = (k: string) => data[k] || "";
  const out = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Roofing Contract - One Solutions</title>
<style>
    @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;700;900&display=swap');

    :root {
        --primary-color: #f48221;
        --secondary-color: #1d1d1b;
        --bg-color: #f9f9f9;
        --text-color: #333333;
        --border-color: #e0e0e0;
    }

    body {
        font-family: 'Roboto', sans-serif;
        color: var(--text-color);
        background-color: var(--bg-color);
        margin: 0;
        padding: 40px 20px;
        line-height: 1.6;
    }

    .document-container {
        max-width: 900px;
        margin: 0 auto;
        background-color: #ffffff;
        padding: 60px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.05);
        border-top: 8px solid var(--primary-color);
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        border-bottom: 2px solid var(--border-color);
        padding-bottom: 20px;
        margin-bottom: 30px;
    }

    .logo-area {
        display: flex;
        align-items: center;
        gap: 15px;
    }

    .logo-s {
        width: 90px;
        height: 120px;
    }

    .brand-text {
        display: flex;
        flex-direction: column;
    }

    .brand-one {
        font-size: 32px;
        font-weight: 900;
        color: var(--primary-color);
        line-height: 1;
        letter-spacing: 1px;
    }

    .brand-solutions {
        font-size: 14px;
        font-weight: 900;
        color: var(--secondary-color);
        letter-spacing: 2px;
    }

    .company-info {
        text-align: right;
        font-size: 13px;
        color: #555;
    }

    .company-info strong {
        color: var(--secondary-color);
        font-size: 15px;
        display: block;
        margin-bottom: 5px;
    }

    .client-info {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin-bottom: 30px;
        background-color: #fcfcfc;
        padding: 20px;
        border: 1px solid var(--border-color);
        border-radius: 4px;
    }

    .form-group {
        display: flex;
        align-items: center;
    }

    .form-group label {
        font-weight: 700;
        margin-right: 10px;
        color: var(--secondary-color);
        min-width: 60px;
    }

    .form-group .line {
        flex: 1;
        border-bottom: 1px solid #ccc;
        height: 20px;
    }

    h2 {
        background-color: var(--secondary-color);
        color: #ffffff;
        padding: 10px 15px;
        font-size: 18px;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-top: 40px;
        margin-bottom: 20px;
        border-left: 5px solid var(--primary-color);
    }

    h3 {
        color: var(--primary-color);
        font-size: 16px;
        margin-top: 25px;
        margin-bottom: 10px;
        text-transform: uppercase;
    }

    .quote-valid {
        font-weight: 700;
        color: #d32f2f;
        text-align: center;
        margin-bottom: 20px;
        font-size: 15px;
    }

    p {
        margin-bottom: 15px;
        font-size: 14px;
        text-align: justify;
    }

    ul {
        margin-top: 0;
        padding-left: 20px;
        font-size: 14px;
    }

    li {
        margin-bottom: 10px;
    }

    .main-bullet {
        font-weight: 700;
        color: var(--secondary-color);
        list-style-type: square;
    }

    .sub-bullet {
        font-weight: normal;
        list-style-type: disc;
        margin-top: 8px;
    }

    .highlight-box {
        background-color: rgba(244, 130, 33, 0.1);
        border: 1px solid var(--primary-color);
        padding: 15px;
        border-radius: 4px;
        margin: 20px 0;
    }

    .price-tag {
        font-weight: 700;
        background-color: #eee;
        padding: 2px 15px;
        border-bottom: 1px solid #000;
        display: inline-block;
        min-width: 100px;
        text-align: right;
    }

    .pricing-details {
        background-color: #f4f4f4;
        padding: 20px;
        border-radius: 4px;
        font-size: 13px;
        margin: 20px 0;
    }

    .pricing-details p {
        margin-bottom: 8px;
    }

    .payment-terms {
        font-size: 16px;
        font-weight: 900;
        text-align: center;
        color: var(--secondary-color);
        padding: 15px;
        border: 2px dashed var(--primary-color);
        margin: 30px 0;
    }

    .total-box {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        margin-top: 20px;
        font-size: 20px;
        font-weight: 900;
    }

    .total-box span {
        margin-left: 15px;
        border-bottom: 2px solid #000;
        min-width: 150px;
        display: inline-block;
    }

    .signatures-container {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        margin-top: 60px;
        gap: 40px;
    }

    .signature-block {
        flex: 1;
        min-width: 250px;
    }

    .signature-line {
        border-bottom: 1px solid #000;
        height: 40px;
        margin-bottom: 5px;
    }

    .signature-label {
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        color: #555;
    }

    .legal-text {
        font-size: 12px;
        color: #555;
    }

    @media print {
        body { background-color: white; padding: 0; }
        .document-container { box-shadow: none; border-top: none; padding: 0; }
        h2 { border-left-color: black !important; }
    }
</style>
</head>
<body>

<div class="document-container">
    <div class="header">
        <div class="logo-area">
            <svg class="logo-s" viewBox="0 0 300 400" xmlns="http://www.w3.org/2000/svg">
                <polygon points="30,100 150,30 270,100 270,120 150,50 30,120" fill="#f48221"/>
                <polygon points="210,115 235,95 255,115 230,135" fill="#1d1d1b"/>
                <circle cx="150" cy="180" r="65" fill="none" stroke="#1d1d1b" stroke-width="18"/>
                <text x="150" y="228" font-family="Arial,sans-serif" font-weight="900" font-size="130" text-anchor="middle" fill="#1d1d1b">S</text>
                <g fill="#f48221">
                    <text x="150" y="325" font-family="Arial Black,Impact,sans-serif" font-weight="900" font-size="95" text-anchor="middle" letter-spacing="1">ONE</text>
                    <rect x="73" y="240" width="6" height="90" fill="#ffffff"/>
                    <rect x="135" y="240" width="6" height="90" fill="#ffffff" transform="skewX(-25)"/>
                    <rect x="228" y="240" width="8" height="90" fill="#ffffff"/>
                </g>
                <text x="150" y="375" font-family="Arial,sans-serif" font-weight="900" font-size="36" text-anchor="middle" fill="#000000" letter-spacing="2">SOLUTIONS</text>
            </svg>
          </div>
          <div class="company-info">
            <strong>ONE SOLUTIONS COMPANIES LLC</strong>
            2419 Lake Orange Dr<br>
            Suite 120<br>
            Orlando, Florida 32837
        </div>
    </div>

    <div class="client-info">
        <div class="form-group">
            <label>DATE:</label>
            ${textOrLine(d("date"))}
        </div>
        <div class="form-group">
            <label>NAME:</label>
            ${textOrLine(d("clientName"))}
        </div>
    </div>

    <div class="quote-valid">QUOTE VALID FOR THIRTY (30) DAYS.</div>

    <h2>Roofing Section</h2>

    <ul>
        <li class="main-bullet"><strong>Permits and Inspections:</strong> One Solutions Companies LLC manages all permits and inspections, guaranteeing a seamless process and your full compliance with local regulations.</li>
        <li class="main-bullet"><strong>Roof Removal and Decking.</strong>
            <ul>
                <li class="sub-bullet">Remove one layer of existing roof and underlayment to expose decking.</li>
                <li class="sub-bullet">To prevent serious roof integrity failure, we need replace any compromised wood or metal, such as rotten, deteriorated, water damaged, structural damaged, poor conditions, rusted or structural deterioration. Fascia around the perimeter will also be inspected and replaced as needed. All work complies with Florida Building Code and professional roofing standards, to meet code requirements. (Not Painted. SEE PRICE DETAILS BELOW.)</li>
                <li class="sub-bullet">Re-nail entire decking to code to ensure structural integrity and meet all code specifications. This process reinforces your roof's foundation, enhancing its durability and safety for years to come.</li>
            </ul>
        </li>
        <li class="main-bullet"><strong>Roof Installation.</strong>
            <ul>
                <li class="sub-bullet">Install a double layer of Owens Corning Rhino high-performance synthetic underlayment as a dry-in application, fully compliant with the 2023 Florida Building Code. This premium underlayment ensures superior moisture protection and enhances the longevity and durability of your roof.</li>
                <li class="sub-bullet">Install Owens Corning premium Peel N Stick in all valleys, providing superior protection against leaks and water damage. This high-quality material ensures a secure seal, enhancing your roof's durability and longevity by safeguarding the most vulnerable areas of your roof.</li>
                <li class="sub-bullet">Install 2in drip edge around perimeter of the roof, ensure water runoff and preventing water damage. This added layer of protection helps direct water away from your roof's edges, safeguarding your structure and enhancing the longevity of your roofing system.
                    <div style="margin-top:10px; font-weight:bold;">COLOR: ${d("roofColor") ? `<span style="font-weight:600;">${d("roofColor")}</span>` : '<span style="display:inline-block; border-bottom:1px solid #000; width:150px;"></span>'}</div>
                </li>
                <li class="sub-bullet">Install new ( ) 2in & ( ) 3in lead boots, providing a secure, long-lasting seal around your pipes.</li>
                <li class="sub-bullet">Install ( ) new exhaust vents.</li>
                <li class="sub-bullet">Install ( ) new Owens Corning SureVent ridge vents, ensuring optimal attic ventilation and air circulation. This high-performance system allows heat and moisture to escape, preventing roof damage, reducing energy costs, and improving the overall lifespan of your roof.</li>
                <li class="sub-bullet">Install ( ) new (off ridge) vents. To enhance attic ventilation by promoting consistent airflow. This ensures better temperature regulation, reduces the risk of moisture buildup, and prevents potential damage to your roofing system. Off-ridge vents help extend the lifespan of and improve overall energy efficiency.</li>
                <li class="sub-bullet">Install OWENS CORNING TRUDIFINITION SUREVENT Duration shingles with a 130mph wind resistance. Designed for superior performance and durability. With advanced nail strip technology, these shingles provide unmatched resistance up to 130mph, ensuring your roof remains secure in even the harshest conditions. These high-performance architectural shingles not only enhance the aesthetic appeal of your home but also deliver long lasting protection against the elements.<br><br>
                <em>Shingles will be secured with six nails per shingle. We ensure maximum stability and long-term durability by securing each shingle with six nails. This extra reinforcement guarantees superior wind resistance and helps prevent shifting or lifting, providing your roof with enhanced protection and longevity, even in severe weather conditions.</em></li>
                <li class="sub-bullet">Remove all debris and dispose of it properly. We take care to remove all debris from your property, ensuring your space is left clean and free of any waste.</li>
                <li class="sub-bullet">Conduct a magnetic sweep of the yard and driveway. After the job is complete, we perform a comprehensive magnetic sweep of your yard and driveway to collect any remaining nails or metal debris, ensuring the safety of your property and loved ones.</li>
                <li class="sub-bullet">We supply labor and materials for the completion of the job only. We will sometimes order additional materials to ensure the completion of the job since the roofing supply providers close early. Any extra materials left are then to be returned.</li>
                <li class="sub-bullet">The price includes the specified roofing materials, the cost of the specified labor, taxes, and permits fees (if applicable).</li>
            </ul>
        </li>
    </ul>

    <h2>Warranty</h2>
    <div class="highlight-box">
        <strong>MATERIAL WARRANTY AS PROVIDED BY MANUFACTURER & FIVE (5) YEAR WORKMANSHIP FROM FINAL PAYMENT.</strong>
        <p style="margin-top: 10px; margin-bottom: 0;">This coverage reflects our commitment to quality and gives you long-term peace of mind, knowing your roof is backed by both durable products and expert installation.</p>
    </div>

    <h3>Optional Warranty <span style="font-size:12px; color:#555; font-weight:normal;">(Available Upon Request)</span></h3>
    <p>Owens Corning Preferred Protection Warranty 50 year non prorated material coverage, blow off coverage for the first 15 years (up to 130 MPH), and 10 year workmanship coverage. This warranty is backed directly by Owens Corning when installed as part of a complete roofing system by an Owens Corning Certified Contractor. (See warranty for complete details.)</p>
    <p><strong>Cost of Optional Warranty:</strong> <span class="price-tag">${d("optionalWarrantyCost") ? "$" + d("optionalWarrantyCost") : "$"}</span></p>
    <p style="font-size: 12px; font-style: italic;">Note: This warranty is optional and may be added to your contract upon request.</p>

    <h3>Optional Upgrade-Standing Seam Metal Roof System <span style="font-size:12px; color:#555; font-weight:normal;">(Available Upon Request)</span></h3>
    <ul>
        <li>Install one layer of POLYGLASS POLYSTICK MTS PLUS underlayment as a dry-in application per 2023 Florida Building Code.</li>
        <li>Install standing seam (hidden fastener) 1" nail strip metal panels, 26-gauge with striations.</li>
        <li>Panels to be Galvalume (55% Aluminum, 43.4% Zinc, 1.6% Silicon) with standard Kynar 500 PVDF premium high-performance coating, considered one of the most durable finishes in the industry.</li>
        <li>Secure metal panels to the roof deck with the proper fasteners along the screw flange using pancake screws.</li>
    </ul>
    <p><strong>Optional Upgrade Cost:</strong> <span class="price-tag">${d("optionalUpgradeCost") ? "$" + d("optionalUpgradeCost") : "$"}</span></p>

    <div class="pricing-details">
        <p>Includes two (2) plywood if necessary<br>
        Two (2) Skylight 2x2<br>
        Does not include soffits. Does not include stucco, siding or painting repair work where deteriorated L-flashing had to be replaced.<br>
        Does not include solar panels, gutters, or skylights. Unless otherwise stipulated, we will detach and reset existing skylights and/or gutters.<br>
        Additional layers of shingle will cost $ 30sq if found during removal.</p>

        <p><strong>ALL ROTTED WOODWORK IS ADDITIONAL $95.00 per SHEET OF PLYWOOD.</strong><br>
        1x2/2x4 $5.15LF. 1x6/1x10/1x12 $9.70LF. IF CEDAR WOOD $12.50LF.<br>
        <strong>ALL ROTTED METALWORK IS ADDITIONAL FLASHING $18.00LF and COUNTER FLASHING $18.00LF.</strong></p>

        <p style="text-align: center; font-weight: bold; margin-top: 15px;">
        (PLEASE BE AWARE THAT THE HOMEOWNER IS RESPONSIBLE FOR MAKING THE PROPER ARRANGEMENTS TO BE HOME DURING THE ROOFING JOB. WE MUST REPLACE ALL THE NECESSARY WOODWORK WITH SIMILAR MATERIALS AT THE QUOTED PRICES AS THE DECKING CANNOT BE LEFT EXPOSED DUE TO THE RISK FOR WATER INTRUSION.)
        </p>
    </div>

    <div class="payment-terms">
        PAYMENT TERMS: 50% DEPOSIT & THE BALANCE DUE UPON JOB COMPLETION.
    </div>

    <div class="total-box">
        Shingle Roofing TOTAL: <span>${d("shingleTotal") ? "$" + d("shingleTotal") : ""}</span>
    </div>

    <h2>"What Makes Us Different?"</h2>
    <p>At "One Solutions Companies LLC", we do not just install roofs, we install "complete roofing systems" engineered for long-term performance, energy efficiency, and protection against Florida's toughest weather conditions.</p>
    <p>Our process is built around three key pillars:</p>
    <ul>
        <li><strong>"Protection"</strong> - We use premium materials like Owens Corning&reg; shingles, advanced underlayment and components to create a roofing system that defends your home from wind and water.</li>
        <li><strong>"Transparency"</strong> - No surprises. You get clear, detailed quotes, honest pricing, and open communication every step of the way.</li>
        <li><strong>"Professionalism"</strong> - Our dedicated team handles everything-from permits to final inspection-with a focus on quality, cleanliness, and respect for your home.</li>
    </ul>
    <p><em>We deliver more than a roof. We deliver "peace of mind", backed by warranties, built to code, and designed to last.</em></p>

    <h2>Homeowners Rights and Responsibilities</h2>
    <div class="legal-text">
        <p>Please do not walk the perimeter of the property during the installation process. There will be hundreds of nails on the ground. Debris, tools and sometimes materials can slide off the side of the roof. Staying indoors, or at minimum of 30 feet away from the edge of the roof is required by OSHA.</p>
        <p>Please secure objects along the perimeter of your roof. Things like fountains, flowerpots, bird feeders, garden figurines and other accessories can also be damaged during an installation. We will cover your bushes and landscaping with tarps, but even those cannot protect an object completely. Please secure valuable objects inside your house, especially if they are adjacent to a wall. The vibrations caused by the installation might knock them down and break them.</p>
        <p>Please be on the lookout for nails. We perform a magnetic sweep throughout the whole property, and police your driveway when we are done. But even the smallest roof has over 10,000 nails. Sometimes we might miss one. We would not want anybody to get hurt or damage your tire. If a tire does get damaged, we require a picture of the tire with a nail in it, and a receipt for the repair or replacement.</p>
        <p>Dumpsters are for roof debris only. Personal garbage is not allowed, while certain types of garbage is not allowed in certain landfills. Any garbage placed in company dumpsters that goes over the side rail, or is not allowed will be billed as an additional charge to the homeowner, up to the amount of a second dumpster. Dumpsters are usually picked up within 24 hours after installation but could take up to 72 hours. Business days only.</p>
        <p>Many neighborhoods have homeowners associations. It is the homeowner's responsibility to advise One Solutions Companies LLC if any homeowners association approvals are required before commencing work. One Solutions Companies LLC is not responsible for any consequences associated with work being performed without HOA's approval.</p>
    </div>

    <h2>Terms and Conditions</h2>
    <div class="legal-text">
        <p>The homeowner shall pay all costs and expenses incurred by One Solutions Companies LLC (including, without limitation, court costs and reasonable attorney's fees) in connection with the roofing factory's collection efforts in the event the homeowner fails to pay the balance due upon completion of the scope of work.</p>
        <p>Should I elect to cancel this agreement outside of the statutory three-day (3) time frame, a cancellation fee of 20% of the estimate shall apply to compensate the contractor for the time, expenses, and professional services rendered to the owner or agent.</p>
        <p>The Agreement will be subject to all applicable laws, regulations, and ordinances, as well as the following special terms and conditions. As per Florida Construction Lien Law (SECTION 713.001-713.37, Florida Statutes), individuals who perform work on your property or furnish materials and are not compensated in full have the right to assert their claim for payment against your property. This claim is referred to as a construction lien.</p>
        <p>If your contractor or subcontractor fails to make the legally required payments for subcontractors, materials suppliers, or negligence, the individuals who are owed money may look to your property for payment, even if you have fully compensated your contractor. If you fail to reimburse your contractor, they may also have a lien on your property. This implies that in the event of a lien being filed, your property may be sold against your will to compensate.</p>
        <p>For labor, materials, or other services that your contractor or subcontractor may have failed to provide, Florida's construction lien law is comprehensive, and it is recommended that it be followed. Whenever a specific issue arises, it is advisable to consult with an attorney.</p>
        <p>The Contractor shall have no responsibility for damages from fire, windstorm or other hazards, as is normally considered to be covered by homeowners' insurance, unless specific written agreement has been made prior to commencement of work. The Contractor shall not be liable to the customer for any labor controversies, strikes, fires, weather, or inability to obtain materials from the usual sources. During the warranty period, the contractor is not responsible for any damage below the roof due to debris, hail, or preexisting construction defects.</p>
        <p>This includes but is not limited to AC, supply and water lines that are situated along the rafters or attached to the underside of the roof decking. The AC and water lines should be installed at least 6 inches below the roof. This helps prevent nails from getting into the lines. The contractor cannot be held responsible if the AC or water lines get damaged during roof construction.</p>
        <p>This agreement constitutes the entirety of the agreement between the parties. It can only be modified through a written instrument signed by both parties. If any provision of this Agreement is held to be invalid or unenforceable, the validity and enforceability of the remaining provisions will not be affected. Any representations, statements, or other communications that are not written in this agreement are agreed to be irrelevant and cannot be relied on by either party. During the work, the Owners homeowner's insurance will pay for any interior damage as long as the Contractor has taken steps to protect the roof.</p>
        <p>The Contractor shall not be responsible for any consequential damages and any damages shall be limited to the return of the contract price. This agreement and guarantee cannot be given to someone else without prior written permission. In order for a warranty to be valid, the contract must be paid in full. In the event of non-payment by the Owner, the Owner agrees to bear all expenses incurred in collection, including the reduction of this obligation to judgment, which includes attorney's fees. All legal proceedings arising from this contract shall take place in Florida. The Contractor has the authority to procure excess materials. These materials shall not be charged beyond the agreed upon price. All excess materials are owned by the contractor. Your contractor is not responsible for evaluating your attic flooring and air circulation. The contractor will comply with local building codes by installing roof vents. Mold is a common occurrence in Florida homes, and any question about the dangers from mold can be determined by consulting the Centers for Disease Control and Prevention and the Florida Department of Health. Owners agree that Contractor will not be responsible for any damage caused by mold or any other fungus or biological material, regardless of whether it may be associated with defects in Contractor's construction or services, including but not limited to property damage, personal injury, loss of income, emotional distress, death.</p>
        <p>These conditions will be considered part of any Agreements that are entered into or authorized to proceed with. If there is any litigation under this Agreement, the prevailing party shall be entitled to reasonable attorney's fees and costs, including attorney's fees in probate proceedings or at the appellate level. The Contractor shall get all necessary licenses and permits to complete roof repair. If the owner wants to make changes to the agreement after construction starts, the contractor will tell them how much more it will cost. The owner can choose to accept or reject the changes. If the changes are accepted, they must be paid for.</p>
        <p><strong>I have read and understand my responsibilities, so this job is completed in the safest manner possible.</strong></p>
    </div>

    <div class="signatures-container">
        <div class="signature-block">
            ${d("companySignature") ? imgTag(d("companySignature")) : '<div class="signature-line"></div>'}
            <div class="signature-label">Company Authorized Signature</div>
        </div>
        <div class="signature-block">
            ${d("companyDate") ? `<div style="height:40px;display:flex;align-items:flex-end;padding-bottom:5px;font-weight:600;">${d("companyDate")}</div>` : '<div class="signature-line"></div>'}
            <div class="signature-label">Date</div>
        </div>
    </div>

    <div class="signatures-container" style="margin-top: 30px;">
        <div class="signature-block">
            ${d("customerSignature1") ? imgTag(d("customerSignature1")) : '<div class="signature-line"></div>'}
            <div class="signature-label">Customer Signature</div>
        </div>
        <div class="signature-block">
            ${d("customerDate1") ? `<div style="height:40px;display:flex;align-items:flex-end;padding-bottom:5px;font-weight:600;">${d("customerDate1")}</div>` : '<div class="signature-line"></div>'}
            <div class="signature-label">Date</div>
        </div>
    </div>

    <div class="signatures-container" style="margin-top: 30px;">
        <div class="signature-block">
            ${d("customerSignature2") ? imgTag(d("customerSignature2")) : '<div class="signature-line"></div>'}
            <div class="signature-label">Customer Signature</div>
        </div>
        <div class="signature-block">
            ${d("customerDate2") ? `<div style="height:40px;display:flex;align-items:flex-end;padding-bottom:5px;font-weight:600;">${d("customerDate2")}</div>` : '<div class="signature-line"></div>'}
            <div class="signature-label">Date</div>
        </div>
    </div>

</div>

</body>
</html>`;
  return out;
}

function purificadorAguaHtml(data: Record<string, string>): string {
  const d = (k: string) => data[k] || "";
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Water Purification Agreement - One Solutions</title>
<style>
    @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;700;900&display=swap');

    :root {
        --primary-color: #f48221;
        --secondary-color: #1d1d1b;
        --bg-color: #f9f9f9;
        --text-color: #333333;
        --border-color: #e0e0e0;
    }

    body {
        font-family: 'Roboto', sans-serif;
        color: var(--text-color);
        background-color: var(--bg-color);
        margin: 0;
        padding: 40px 20px;
        line-height: 1.6;
    }

    .document-container {
        max-width: 900px;
        margin: 0 auto;
        background-color: #ffffff;
        padding: 60px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.05);
        border-top: 8px solid var(--primary-color);
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        border-bottom: 2px solid var(--border-color);
        padding-bottom: 20px;
        margin-bottom: 30px;
    }

    .logo-area {
        display: flex;
        align-items: center;
        gap: 15px;
    }

    .logo-s {
        width: 90px;
        height: 120px;
    }

    .brand-text {
        display: flex;
        flex-direction: column;
    }

    .brand-one {
        font-size: 32px;
        font-weight: 900;
        color: var(--primary-color);
        line-height: 1;
        letter-spacing: 1px;
    }

    .brand-solutions {
        font-size: 14px;
        font-weight: 900;
        color: var(--secondary-color);
        letter-spacing: 2px;
    }

    .company-info {
        text-align: right;
        font-size: 13px;
        color: #555;
    }

    .company-info strong {
        color: var(--secondary-color);
        font-size: 15px;
        display: block;
        margin-bottom: 5px;
    }

    .customer-info {
        background-color: #fcfcfc;
        padding: 20px;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        margin-bottom: 30px;
    }

    .form-group {
        display: flex;
        align-items: center;
        margin-bottom: 10px;
    }

    .form-group label {
        font-weight: 700;
        margin-right: 10px;
        color: var(--secondary-color);
        min-width: 70px;
        white-space: nowrap;
    }

    .form-group .line {
        flex: 1;
        border-bottom: 1px solid #ccc;
        height: 22px;
        display: flex;
        align-items: flex-end;
        font-weight: 600;
        font-size: 14px;
    }

    h2 {
        background-color: var(--secondary-color);
        color: #ffffff;
        padding: 10px 15px;
        font-size: 18px;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-top: 40px;
        margin-bottom: 20px;
        border-left: 5px solid var(--primary-color);
    }

    h3 {
        color: var(--primary-color);
        font-size: 16px;
        margin-top: 25px;
        margin-bottom: 10px;
        text-transform: uppercase;
    }

    p {
        margin-bottom: 15px;
        font-size: 14px;
        text-align: justify;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        margin: 15px 0;
    }

    th {
        background-color: var(--secondary-color);
        color: #ffffff;
        padding: 10px 15px;
        font-size: 13px;
        font-weight: bold;
        text-align: left;
    }

    td {
        padding: 10px 15px;
        font-size: 13px;
        border-bottom: 1px solid var(--border-color);
    }

    .price-col {
        text-align: right;
        width: 25%;
    }

    .total-row td {
        font-weight: 900;
        font-size: 15px;
        background-color: #f4f4f4;
    }

    .highlight-box {
        background-color: rgba(244, 130, 33, 0.1);
        border: 1px solid var(--primary-color);
        padding: 15px;
        border-radius: 4px;
        margin: 20px 0;
    }

    .cancellation-box {
        border: 2px solid var(--secondary-color);
        padding: 20px;
        font-size: 12px;
        margin: 20px 0;
        border-radius: 4px;
    }

    .cancellation-box h3 {
        text-align: center;
        margin-top: 0;
        color: var(--secondary-color);
    }

    .signatures-container {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        margin-top: 60px;
        gap: 40px;
    }

    .signature-block {
        flex: 1;
        min-width: 250px;
    }

    .signature-line {
        border-bottom: 1px solid #000;
        height: 40px;
        margin-bottom: 5px;
    }

    .signature-label {
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        color: #555;
    }

    .legal-text {
        font-size: 12px;
        color: #555;
    }

    @media print {
        body { background-color: white; padding: 0; }
        .document-container { box-shadow: none; border-top: none; padding: 0; }
        h2 { border-left-color: black !important; }
    }
</style>
</head>
<body>

<div class="document-container">
    <div class="header">
        <div class="logo-area">
            <svg class="logo-s" viewBox="0 0 300 400" xmlns="http://www.w3.org/2000/svg">
                <polygon points="30,100 150,30 270,100 270,120 150,50 30,120" fill="#f48221"/>
                <polygon points="210,115 235,95 255,115 230,135" fill="#1d1d1b"/>
                <circle cx="150" cy="180" r="65" fill="none" stroke="#1d1d1b" stroke-width="18"/>
                <text x="150" y="228" font-family="Arial,sans-serif" font-weight="900" font-size="130" text-anchor="middle" fill="#1d1d1b">S</text>
                <g fill="#f48221">
                    <text x="150" y="325" font-family="Arial Black,Impact,sans-serif" font-weight="900" font-size="95" text-anchor="middle" letter-spacing="1">ONE</text>
                    <rect x="73" y="240" width="6" height="90" fill="#ffffff"/>
                    <rect x="135" y="240" width="6" height="90" fill="#ffffff" transform="skewX(-25)"/>
                    <rect x="228" y="240" width="8" height="90" fill="#ffffff"/>
                </g>
                <text x="150" y="375" font-family="Arial,sans-serif" font-weight="900" font-size="36" text-anchor="middle" fill="#000000" letter-spacing="2">SOLUTIONS</text>
            </svg>
          </div>
          <div class="company-info">
            <strong>ONE SOLUTIONS COMPANIES LLC</strong>
            2419 Lake Orange Dr<br>
            Suite 120<br>
            Orlando, Florida 32837
        </div>
    </div>

    <div class="customer-info">
        <div class="form-group"><label>CUSTOMER NAME:</label><div class="line">${textOrLine(d("clientName"))}</div></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <div class="form-group"><label>ADDRESS:</label><div class="line">${textOrLine(d("clientAddress"))}</div></div>
            <div class="form-group"><label>CITY:</label><div class="line">${textOrLine(d("clientCity"))}</div></div>
            <div class="form-group"><label>EMAIL:</label><div class="line">${textOrLine(d("clientEmail"))}</div></div>
            <div class="form-group"><label>ZIP:</label><div class="line">${textOrLine(d("clientZip"))}</div></div>
            <div class="form-group"><label>PHONE:</label><div class="line">${textOrLine(d("clientPhone"))}</div></div>
            <div class="form-group"><label>REP:</label><div class="line">${textOrLine(d("rep"))}</div></div>
        </div>
    </div>

    <h2>Water Purification Services</h2>
    <p><strong>PLEASE ENTER MY ORDER FOR:</strong></p>
    <table>
        <thead>
            <tr><th>SERVICE TO BE PROVIDED</th><th class="price-col">PRICE</th></tr>
        </thead>
        <tbody>
            <tr><td>${d("service1") || "&nbsp;"}</td><td class="price-col">${d("price1") ? "$" + d("price1") : "$"}</td></tr>
            <tr><td>${d("service2") || "&nbsp;"}</td><td class="price-col">${d("price2") ? "$" + d("price2") : "$"}</td></tr>
            <tr><td>${d("service3") || "&nbsp;"}</td><td class="price-col">${d("price3") ? "$" + d("price3") : "$"}</td></tr>
            <tr><td>${d("service4") || "&nbsp;"}</td><td class="price-col">${d("price4") ? "$" + d("price4") : "$"}</td></tr>
            <tr class="total-row"><td>TOTAL:</td><td class="price-col">${d("totalPrice") ? "$" + d("totalPrice") : "$"}</td></tr>
        </tbody>
    </table>

    <div class="highlight-box">
        <strong>Warranty:</strong> 1 year in all workmanship (parts and labor). All work will be guaranteed for a period of one (1) year. All warranties are contingent upon the Contractor being allowed to complete the entire job and upon receiving payment in full.
    </div>

    <div class="cancellation-box">
        <h3>NOTICE OF RIGHT TO CANCEL</h3>
        <p>DATE: ${d("cancellationDate") || "_______________________"}</p>
        <p>YOU MAY CANCEL THIS TRANSACTION, WITHOUT ANY PENALTY OR OBLIGATION, WITHIN 3 BUSINESS DAYS FROM THE ABOVE DATE. IF YOU CANCEL, ANY PROPERTY TRADED IN, ANY PAYMENTS MADE BY YOU, AND ANY NEGOTIABLE INSTRUMENT EXECUTED BY YOU UNDER THE CONTRACT OR TRANSACTION WILL BE RETURNED WITHIN 10 BUSINESS DAYS FOLLOWING RECEIPT BY THE SELLER OF YOUR CANCELLATION NOTICE, AND ANY SECURITY INTEREST ARISING OUT OF THE TRANSACTION WILL BE CANCELLED. IF YOU CANCEL, YOU MUST MAKE AVAILABLE TO THE SELLER AT YOUR RESIDENCE IN SUBSTANTIALLY AS GOOD A CONDITION AS WHEN RECEIVED, ANY GOODS DELIVERED TO YOU UNDER THIS CONTRACT OR TRANSACTION. TO CANCEL THIS TRANSACTION, MAIL OR DELIVER A SIGNED AND DATED COPY OF THIS CANCELLATION NOTICE TO ONE SOLUTIONS COMPANIES LLC, AT 2419 Lake Orange Dr Suite 5, Orlando FL 32837 NOT LATER THAN MIDNIGHT OF ${d("cancellationDeadline") || "_______________________"}</p>
        <p>I HEREBY CANCEL THIS TRANSACTION.</p>
        <div class="signature-block" style="margin-top:15px;">
            ${d("cancelSignature") ? imgTag(d("cancelSignature")) : '<div class="signature-line"></div>'}
            <div class="signature-label">Cancellation Signature</div>
        </div>
    </div>

    <div class="signatures-container">
        <div class="signature-block">
            ${d("companySignature") ? imgTag(d("companySignature")) : '<div class="signature-line"></div>'}
            <div class="signature-label">Company Authorized Signature</div>
        </div>
        <div class="signature-block">
            ${d("companyDate") ? `<div style="height:40px;display:flex;align-items:flex-end;padding-bottom:5px;font-weight:600;">${d("companyDate")}</div>` : '<div class="signature-line"></div>'}
            <div class="signature-label">Date</div>
        </div>
    </div>

    <div class="signatures-container" style="margin-top: 30px;">
        <div class="signature-block">
            ${d("customerSignature") ? imgTag(d("customerSignature")) : '<div class="signature-line"></div>'}
            <div class="signature-label">Customer Signature</div>
        </div>
        <div class="signature-block">
            ${d("customerDate") ? `<div style="height:40px;display:flex;align-items:flex-end;padding-bottom:5px;font-weight:600;">${d("customerDate")}</div>` : '<div class="signature-line"></div>'}
            <div class="signature-label">Date</div>
        </div>
    </div>

</div>

</body>
</html>`;
}

const techoFields: ContractField[] = [
  { key: "clientName", label: "Client Name", type: "text" },
  { key: "date", label: "Date", type: "date" },
  { key: "roofColor", label: "Roof Color", type: "text" },
  { key: "shingleTotal", label: "Shingle Roofing Total", type: "money" },
  { key: "optionalWarrantyCost", label: "Optional Warranty Cost", type: "money" },
  { key: "optionalUpgradeCost", label: "Optional Upgrade Cost", type: "money" },
  { key: "companySignature", label: "Company Signature", type: "signature" },
  { key: "companyDate", label: "Company Date", type: "date" },
  { key: "customerSignature1", label: "Customer Signature 1", type: "signature" },
  { key: "customerDate1", label: "Customer Date 1", type: "date" },
  { key: "customerSignature2", label: "Customer Signature 2", type: "signature" },
  { key: "customerDate2", label: "Customer Date 2", type: "date" },
];

const purificadorAguaFields: ContractField[] = [
  { key: "clientName", label: "Customer Name", type: "text" },
  { key: "clientAddress", label: "Address", type: "text" },
  { key: "clientCity", label: "City", type: "text" },
  { key: "clientEmail", label: "Email", type: "text" },
  { key: "clientZip", label: "ZIP", type: "text" },
  { key: "clientPhone", label: "Phone", type: "text" },
  { key: "rep", label: "Rep", type: "text" },
  { key: "service1", label: "Service 1", type: "text" },
  { key: "price1", label: "Price 1", type: "money" },
  { key: "service2", label: "Service 2", type: "text" },
  { key: "price2", label: "Price 2", type: "money" },
  { key: "service3", label: "Service 3", type: "text" },
  { key: "price3", label: "Price 3", type: "money" },
  { key: "service4", label: "Service 4", type: "text" },
  { key: "price4", label: "Price 4", type: "money" },
  { key: "totalPrice", label: "Total", type: "money" },
  { key: "companySignature", label: "Company Signature", type: "signature" },
  { key: "companyDate", label: "Company Date", type: "date" },
  { key: "customerSignature", label: "Customer Signature", type: "signature" },
  { key: "customerDate", label: "Customer Date", type: "date" },
  { key: "cancelSignature", label: "Cancellation Signature", type: "signature" },
];

const templates: ContractTemplate[] = [
  { projectType: "Techo", name: "Roofing Contract", html: techoHtml, fields: techoFields },
  { projectType: "Purificador de Agua", name: "Water Purification Agreement", html: purificadorAguaHtml, fields: purificadorAguaFields },
];

export function getTemplatesByProjectTypes(projectTypeNames: string[]): ContractTemplate[] {
  const nameSet = new Set(projectTypeNames.map(n => n.trim()));
  return templates.filter(t => nameSet.has(t.projectType));
}

export { templates };
