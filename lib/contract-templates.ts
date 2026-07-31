export interface ContractField {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "money" | "signature";
  defaultValue?: string;
}

export interface ContractTemplate {
  projectType: string;
  name: string;
  html: (data: Record<string, string>) => string | Promise<string>;
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
            ${d("date") ? `<div style="height:40px;display:flex;align-items:flex-end;padding-bottom:5px;font-weight:600;">${d("date")}</div>` : '<div class="signature-line"></div>'}
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
  { key: "date", label: "Customer Date", type: "date" },
  { key: "cancelSignature", label: "Cancellation Signature", type: "signature" },
];







// === NUEVOS CONTRATOS ===
export const metalRoofFields: ContractField[] = [
  { key: "dripEdgeColor", label: "Drip Edge Color", type: "text" },
  { key: "leadBoots2In", label: "2 in. Lead Boots", type: "text" },
  { key: "leadBoots3In", label: "3 in. Lead Boots", type: "text" },
  { key: "exhaustVents", label: "Exhaust Vents", type: "text" },
  { key: "ridgeVentsFt", label: "Ridge Vents (ft)", type: "text" },
  { key: "companySignature", label: "Company Signature", type: "signature" },
  { key: "companyDate", label: "Company Date", type: "date" },
  { key: "representativeSignature", label: "Representative Signature", type: "signature" },
  { key: "representativeDate", label: "Representative Date", type: "date" }
];

export function metalRoofHtml(data: Record<string, string>): string {
  const d = (k: string) => data[k] || "";
  const imgTag = (src: string) => `<img src="${src}" class="max-h-[40px]" style="max-height: 40px;" alt="Signature" />`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Metal Roof Contract - One Solutions</title>
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
        background-color: #ffffff;
        margin: 0;
        padding: 0;
        display: flex;
        justify-content: center;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }
    
    .page-container {
        background-color: var(--lightbg);
        width: 100%;
        max-width: 210mm;
        position: relative;
        overflow: hidden;
        display: block;
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
        font-size: 22px;
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
                <span class="text-brand">METAL ROOF</span> <span class="text-dark">CONTRACT</span>
            </h1>
        </header>

        <main>
            <div class="section-row">
                <div class="icon-col">
                    <svg fill="#f1853b" style="width:100%; height:100%;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><!--! Font Awesome Free 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2023 Fonticons, Inc. --><path d="M192 0c-41.8 0-77.4 26.7-90.5 64H64C28.7 64 0 92.7 0 128V448c0 35.3 28.7 64 64 64H320c35.3 0 64-28.7 64-64V128c0-35.3-28.7-64-64-64H282.5C269.4 26.7 233.8 0 192 0zm0 64a32 32 0 1 1 0 64 32 32 0 1 1 0-64zM72 272a24 24 0 1 1 48 0 24 24 0 1 1 -48 0zm104-16H304c8.8 0 16 7.2 16 16s-7.2 16-16 16H176c-8.8 0-16-7.2-16-16s7.2-16 16-16zM72 368a24 24 0 1 1 48 0 24 24 0 1 1 -48 0zm88 0c0-8.8 7.2-16 16-16H304c8.8 0 16 7.2 16 16s-7.2 16-16 16H176c-8.8 0-16-7.2-16-16z"/></svg>
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
                        <li>Install one layer of POLYGLASS POLYSTICK MTS PLUS underlayment as a dry-in application per 2023 FL BLDG Code.</li>
                        <li>Install valley metal in all valleys.</li>
                        <li>Install 2½ in. drip edge around perimeter of the roof. COLOR: ${d("dripEdgeColor")}</li>
                        <li>Install new (<span class="text-brand">${d("leadBoots2In")}</span>) 2 in. & (<span class="text-brand">${d("leadBoots3In")}</span>) 3 in. lead boots.</li>
                        <li>Install (<span class="text-brand">${d("exhaustVents")}</span>) new exhaust vents.</li>
                        <li>Install (<span class="text-brand">${d("ridgeVentsFt")}</span> ft) new ridge vents.</li>
                        <li>Install standing seam (hidden screws) 1" nail strip metal panels &ndash; 26 ga. With Striations. (Galvalume &ndash; 55% Aluminum, 43.4% Zinc, 1.6% Silicon with standard SMP coating).</li>
                        <li>Secure Metal Panels to the roof deck with the proper fasteners along the screw flange using pancake screw.</li>
                        <li>Remove all debris and dispose of it properly.</li>
                        <li>Conduct a magnetic sweep of the yard and driveway.</li>
                        <li>The price includes the specified roofing materials, the cost of the specified labor, taxes, and permits fees (if applicable).</li>
                    </ul>
                </div>
            </div>

            <div class="section-row">
                <div class="icon-col">
                    <svg fill="#f1853b" style="width:100%; height:100%;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Free 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2023 Fonticons, Inc. --><path d="M256 48a208 208 0 1 1 0 416 208 208 0 1 1 0-416zm0 464A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-111 111-47-47c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l64 64c9.4 9.4 24.6 9.4 33.9 0L369 209z"/></svg>
                </div>
                <div class="content-col">
                    <h2 class="section-title">WARRANTY</h2>
                    <p class="content-text">
                        MATERIAL WARRANTY AS PROVIDED BY MANUFACTURER, TWENTY FIVE (25) YEARS & FIVE (5) YEARS WORKMANSHIP FROM FINAL PAYMENT.
                    </p>
                </div>
            </div>

            <div class="section-row">
                <div class="icon-col">
                    <svg fill="#f1853b" style="width:100%; height:100%;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Free 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2023 Fonticons, Inc. --><path d="M367.2 412.5L99.5 144.8C77.1 176.1 64 214.5 64 256c0 106 86 192 192 192c41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3C434.9 335.9 448 297.5 448 256c0-106-86-192-192-192c-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256z"/></svg>
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
                         <svg fill="#f1853b" style="width:100%; height:100%;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><!--! Font Awesome Free 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2023 Fonticons, Inc. --><path d="M160 0c17.7 0 32 14.3 32 32V67.7c1.6 .2 3.1 .4 4.7 .7c.4 .1 .7 .1 1.1 .2l48 8.8c17.4 3.2 28.9 19.9 25.7 37.2s-19.9 28.9-37.2 25.7l-47.5-8.7c-31.3-4.6-58.9-1.5-78.3 6.2s-27.2 18.3-29 28.1c-2 10.7-.5 16.7 1.2 20.4c1.8 3.9 5.5 8.3 12.8 13.2c16.3 10.7 41.3 17.7 73.7 26.3l2.9 .8c28.6 7.6 63.6 16.8 89.6 33.8c14.2 9.3 27.6 21.9 35.9 39.5c8.5 17.9 10.3 37.9 6.4 59.2c-6.9 38-33.1 63.4-65.6 76.7c-13.7 5.6-28.6 9.2-44.4 11V480c0 17.7-14.3 32-32 32s-32-14.3-32-32V445.1c-.4-.1-.9-.1-1.3-.2l-.2 0 0 0c-24.4-3.8-64.5-14.3-91.5-26.3c-16.1-7.2-23.4-26.1-16.2-42.2s26.1-23.4 42.2-16.2c20.9 9.3 55.3 18.5 75.2 21.6c31.9 4.7 58.2 2 76-5.3c16.9-6.9 24.6-16.9 26.8-28.9c1.9-10.6 .4-16.7-1.3-20.4c-1.9-4-5.6-8.4-13-13.3c-16.4-10.7-41.5-17.7-74-26.3l-2.8-.7 0 0C119.4 279.3 84.4 270 58.4 253c-14.2-9.3-27.5-22-35.8-39.6c-8.4-17.9-10.1-37.9-6.1-59.2C23.7 116 52.3 91.2 84.8 78.3c13.3-5.3 27.9-8.9 43.2-11V32c0-17.7 14.3-32 32-32z"/></svg>
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
                    <svg fill="#f1853b" style="width:100%; height:100%;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Free 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2023 Fonticons, Inc. --><path d="M406.5 399.6C387.4 352.9 341.5 320 288 320H224c-53.5 0-99.4 32.9-118.5 79.6C69.9 362.2 48 311.7 48 256C48 141.1 141.1 48 256 48s208 93.1 208 208c0 55.7-21.9 106.2-57.5 143.6zm-40.1 32.7C334.4 452.4 296.6 464 256 464s-78.4-11.6-110.5-31.7c7.3-36.7 39.7-64.3 78.5-64.3h64c38.8 0 71.2 27.6 78.5 64.3zM256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm0-272a40 40 0 1 1 0-80 40 40 0 1 1 0 80zm-88-40a88 88 0 1 0 176 0 88 88 0 1 0 -176 0z"/></svg>
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
                    <svg fill="#f1853b" style="width:100%; height:100%;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><!--! Font Awesome Free 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2023 Fonticons, Inc. --><path d="M64 0C28.7 0 0 28.7 0 64V448c0 35.3 28.7 64 64 64H320c35.3 0 64-28.7 64-64V160H256c-17.7 0-32-14.3-32-32V0H64zM256 0V128H384L256 0zM64 80c0-8.8 7.2-16 16-16h64c8.8 0 16 7.2 16 16s-7.2 16-16 16H80c-8.8 0-16-7.2-16-16zm0 64c0-8.8 7.2-16 16-16h64c8.8 0 16 7.2 16 16s-7.2 16-16 16H80c-8.8 0-16-7.2-16-16zm128 72c8.8 0 16 7.2 16 16v17.3c8.5 1.2 16.7 3.1 24.1 5.1c8.5 2.3 13.6 11 11.3 19.6s-11 13.6-19.6 11.3c-11.1-3-22-5.2-32.1-5.3c-8.4-.1-17.4 1.8-23.6 5.5c-5.7 3.4-8.1 7.3-8.1 12.8c0 3.7 1.3 6.5 7.3 10.1c6.9 4.1 16.6 7.1 29.2 10.9l.5 .1 0 0 0 0c11.3 3.4 25.3 7.6 36.3 14.6c12.1 7.6 22.4 19.7 22.7 38.2c.3 19.3-9.6 33.3-22.9 41.6c-7.7 4.8-16.4 7.6-25.1 9.1V440c0 8.8-7.2 16-16 16s-16-7.2-16-16V422.2c-11.2-2.1-21.7-5.7-30.9-8.9l0 0c-2.1-.7-4.2-1.4-6.2-2.1c-8.4-2.8-12.9-11.9-10.1-20.2s11.9-12.9 20.2-10.1c2.5 .8 4.8 1.6 7.1 2.4l0 0 0 0 0 0c13.6 4.6 24.6 8.4 36.3 8.7c9.1 .3 17.9-1.7 23.7-5.3c5.1-3.2 7.9-7.3 7.8-14c-.1-4.6-1.8-7.8-7.7-11.6c-6.8-4.3-16.5-7.4-29-11.2l-1.6-.5 0 0c-11-3.3-24.3-7.3-34.8-13.7c-12-7.2-22.6-18.9-22.7-37.3c-.1-19.4 10.8-32.8 23.8-40.5c7.5-4.4 15.8-7.2 24.1-8.7V232c0-8.8 7.2-16 16-16z"/></svg>
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
                        ${d("companySignature") ? `<div class="sig-line">${imgTag(d("companySignature"))}</div>` : `<div class="sig-line"></div>`}
                        <div class="sig-label">SIGNATURE</div>
                        ${d("companyDate") ? `<div class="sig-line" style="font-weight:700; font-size:14px; min-height:20px; align-items:flex-end; padding-bottom:2px;">${d("companyDate")}</div>` : `<div class="sig-line" style="min-height:20px;"></div>`}
                        <div class="date-label">DATE</div>
                    </div>
                </div>
                
                <div>
                    <img src="/iconoempresa.png" class="footer-logo" alt="Icon" onerror="this.style.display='none'">
                </div>
                
                <div class="sig-col">
                    <h3 class="sig-title"><span class="text-dark">THE</span> <span class="text-brand">REPRESENTATIVE</span></h3>
                    <div style="width:100%;">
                        ${d("representativeSignature") ? `<div class="sig-line">${imgTag(d("representativeSignature"))}</div>` : `<div class="sig-line"></div>`}
                        <div class="sig-label">SIGNATURE</div>
                        ${d("representativeDate") ? `<div class="sig-line" style="font-weight:700; font-size:14px; min-height:20px; align-items:flex-end; padding-bottom:2px;">${d("representativeDate")}</div>` : `<div class="sig-line" style="min-height:20px;"></div>`}
                        <div class="date-label">DATE</div>
                    </div>
                </div>
                
            </div>
        </div>
        
        <div class="bottom-line-left"></div>
        <div class="bottom-line-right"></div>
        
    </div>
</body>
</html>`;
}




export function metalRoofIsoHtml(data: Record<string, string>): string {
  const d = (k: string) => data[k] || "";
  const imgTag = (src: string) => `<img src="${src}" class="max-h-[40px]" style="max-height: 40px;" alt="Signature" />`;

  return `<!DOCTYPE html>
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
        background-color: #ffffff;
        margin: 0;
        padding: 0;
        display: flex;
        justify-content: center;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }
    
    .page-container {
        background-color: var(--lightbg);
        width: 100%;
        max-width: 210mm;
        position: relative;
        overflow: hidden;
        display: block;
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
                        <li>Install 2½ in. drip edge around perimeter of the roof. COLOR: ${d("color")}</li>
                        <li>Install new (${d("new2InLeadBoots")}) 2 in. & (${d("new3InLeadBoots")}) 3 in. lead boots.</li>
                        <li>Install (${d("newExhaustVents")}) new exhaust vents.</li>
                        <li>Install (${d("newRidgeVentsFt")} ft) new ridge vents.</li>
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
                        ${d("companySignature") ? `<div class="sig-line">${imgTag(d("companySignature"))}</div>` : `<div class="sig-line"></div>`}
                        <div class="sig-label">SIGNATURE</div>
                        ${d("companyDate") ? `<div class="sig-line" style="font-weight:700; font-size:14px; min-height:20px; align-items:flex-end; padding-bottom:2px;">${d("companyDate")}</div>` : `<div class="sig-line" style="min-height:20px;"></div>`}
                        <div class="date-label">DATE</div>
                    </div>
                </div>
                
                <div>
                    <img src="/iconoempresa.png" class="footer-logo" alt="Icon" onerror="this.style.display='none'">
                </div>
                
                <div class="sig-col">
                    <h3 class="sig-title"><span class="text-dark">THE</span> <span class="text-brand">REPRESENTATIVE</span></h3>
                    <div style="width:100%;">
                        ${d("representativeSignature") ? `<div class="sig-line">${imgTag(d("representativeSignature"))}</div>` : `<div class="sig-line"></div>`}
                        <div class="sig-label">SIGNATURE</div>
                        ${d("representativeDate") ? `<div class="sig-line" style="font-weight:700; font-size:14px; min-height:20px; align-items:flex-end; padding-bottom:2px;">${d("representativeDate")}</div>` : `<div class="sig-line" style="min-height:20px;"></div>`}
                        <div class="date-label">DATE</div>
                    </div>
                </div>
                
            </div>
        </div>
        
        <div class="bottom-line-left"></div>
        <div class="bottom-line-right"></div>
        
    </div>
</body>
</html>`;
}


export const metalRoofIsoFields: ContractField[] = [
  { key: "color", label: "Color", type: "text" },
  { key: "new2InLeadBoots", label: "New 2 in. Lead Boots", type: "text" },
  { key: "new3InLeadBoots", label: "New 3 in. Lead Boots", type: "text" },
  { key: "newExhaustVents", label: "New Exhaust Vents", type: "text" },
  { key: "newRidgeVentsFt", label: "New Ridge Vents (ft)", type: "text" },
  { key: "companySignature", label: "Company Signature", type: "signature" },
  { key: "companyDate", label: "Company Date", type: "date" },
  { key: "representativeSignature", label: "Representative Signature", type: "signature" },
  { key: "representativeDate", label: "Representative Date", type: "date" }
];

export const skylightFields: ContractField[] = [
  { key: "companySignature", label: "Company Signature", type: "signature" },
  { key: "companyDate", label: "Company Date", type: "date" },
  { key: "representativeSignature", label: "Representative Signature", type: "signature" },
  { key: "representativeDate", label: "Representative Date", type: "date" }
];

export function skylightHtml(data: Record<string, string>): string {
  const d = (k: string) => data[k] || "";
  const imgTag = (url: string) => `<img src="${url}" alt="Signature" style="max-height: 40px; margin: auto;" />`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contract - One Solutions</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        .custom-list li::marker {
            color: #363636;
            font-size: 0.8em;
        }
    </style>
</head>
<body class="bg-white flex justify-center font-sans m-0 p-0">

    <!-- A4 Paper Container -->
    <div class="bg-white w-full max-w-[210mm] shadow-2xl relative overflow-hidden block p-0">
        
        <!-- Header -->
        <header class="relative w-full h-[140px]">
            <!-- Top Left Orange Shape -->
            <div class="absolute top-0 left-0 w-[280px] h-[80px] z-0">
                <svg viewBox="0 0 420 115" class="w-full h-full">
                    <path d="M 0 0 L 330 0 C 400 0, 410 90, 360 115 L 0 115 Z" fill="#f1853b" />
                    <!-- Black circuit lines -->
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

            <!-- Black Line extending to the right (starts after the pill) -->
            <div class="absolute top-[50px] left-[90px] right-[140px] z-0 h-[8px] bg-[#18181b] rounded-r-full"></div>

            <!-- Italic Text above the line -->
            <div class="absolute top-[32px] left-[300px] z-20 text-[#555] italic text-[10px] font-normal tracking-wider">
                QUOTE VALID FOR SEVEN (07) DAYS
            </div>

            <!-- Pill Container -->
            <div class="absolute top-[32px] left-[90px] z-20 rounded-full p-[4px] bg-white shadow-sm">
                <div class="bg-[#262626] text-white font-bold rounded-full py-[12px] px-0 text-[10px] tracking-wide">
                    ONESOLUTIONS COMPANIES LLC
                </div>
            </div>

            <!-- Top Right Orange Lines -->
            <div class="absolute top-2 right-0 w-[180px] h-[60px] z-0">
                <svg viewBox="0 0 180 60" class="w-full h-full">
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

            <!-- Logo -->
            <div class="absolute top-2 right-[70px] z-30 bg-white rounded-full">
                <img src="/logo-company.png" alt="One Solutions Logo" class="h-32 object-contain" onerror="this.style.display='none'">
            </div>
            <!-- Title -->
            <h1 class="absolute top-[105px] left-[105px] z-30 text-[18px] md:text-[22px] font-black tracking-wide">
                <span class="text-brand">SKYLIGHT</span> <span class="text-dark">CONTRACT</span>
            </h1>
        </header>

        <!-- Main Content -->
        <main class="px-4 md:px-12 flex-grow mt-8 mb-[30px]">

            <!-- Sections -->
            <div class="space-y-3">

                <!-- Optional Upgrade -->
                <div class="flex gap-[1px] mb-[10px]">
                    <div class="mt-1 flex-shrink-0 w-10 flex justify-center text-brand">
                        <i class="fa-solid fa-sliders text-[24px]"></i>
                    </div>
                    <div>
                        <h2 class="text-[12px] font-bold text-brand mb-3 uppercase">OPTIONAL UPGRADE</h2>
                        <ul class="list-disc custom-list pl-5 space-y-1.5 text-[12px] text-gray-800 font-medium">
                            <li>Install a New 2x4 Glass Skylight &ndash; $697.99 (Each One)</li>
                        </ul>
                        <p class="text-[12px] text-gray-800 font-medium leading-relaxed mt-2">
                            Enhance your space with natural light by installing a new 2x4 glass skylight. This high-quality skylight is designed for durability and energy efficiency, bringing brightness to any room while minimizing heat loss. Installation includes sealing and flashing to ensure a watertight fit. Note: Price not included in the total value of the estimate.
                        </p>
                    </div>
                </div>

                <!-- Warranty -->
                <div class="flex gap-[1px] mb-[10px]">
                    <div class="mt-0 text-xl flex-shrink-0 w-10 flex justify-center">
                        <svg fill="#f1853b" style="width:100%; height:100%;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Free 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2023 Fonticons, Inc. --><path d="M256 48a208 208 0 1 1 0 416 208 208 0 1 1 0-416zm0 464A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-111 111-47-47c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l64 64c9.4 9.4 24.6 9.4 33.9 0L369 209z"/></svg>
                    </div>
                    <div>
                        <h2 class="text-[12px] font-bold text-brand mb-3 uppercase">WARRANTY</h2>
                        <p class="text-[12px] text-gray-800 font-medium uppercase mt-[2px]">
                            WARRANTY: ONE (1) YEAR WORKMANSHIP FROM FINAL PAYMENT.
                        </p>
                    </div>
                </div>

                <!-- Additional Charges -->
                <div class="flex gap-[1px] mb-[10px]">
                    <div class="mt-0 flex-shrink-0 w-10 flex justify-center">
                        <div class="border-[2px] border-brand rounded-full w-[28px] h-[28px] flex items-center justify-center text-brand mt-[2px]">
                             <svg fill="#f1853b" style="width:100%; height:100%;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><!--! Font Awesome Free 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2023 Fonticons, Inc. --><path d="M160 0c17.7 0 32 14.3 32 32V67.7c1.6 .2 3.1 .4 4.7 .7c.4 .1 .7 .1 1.1 .2l48 8.8c17.4 3.2 28.9 19.9 25.7 37.2s-19.9 28.9-37.2 25.7l-47.5-8.7c-31.3-4.6-58.9-1.5-78.3 6.2s-27.2 18.3-29 28.1c-2 10.7-.5 16.7 1.2 20.4c1.8 3.9 5.5 8.3 12.8 13.2c16.3 10.7 41.3 17.7 73.7 26.3l2.9 .8c28.6 7.6 63.6 16.8 89.6 33.8c14.2 9.3 27.6 21.9 35.9 39.5c8.5 17.9 10.3 37.9 6.4 59.2c-6.9 38-33.1 63.4-65.6 76.7c-13.7 5.6-28.6 9.2-44.4 11V480c0 17.7-14.3 32-32 32s-32-14.3-32-32V445.1c-.4-.1-.9-.1-1.3-.2l-.2 0 0 0c-24.4-3.8-64.5-14.3-91.5-26.3c-16.1-7.2-23.4-26.1-16.2-42.2s26.1-23.4 42.2-16.2c20.9 9.3 55.3 18.5 75.2 21.6c31.9 4.7 58.2 2 76-5.3c16.9-6.9 24.6-16.9 26.8-28.9c1.9-10.6 .4-16.7-1.3-20.4c-1.9-4-5.6-8.4-13-13.3c-16.4-10.7-41.5-17.7-74-26.3l-2.8-.7 0 0C119.4 279.3 84.4 270 58.4 253c-14.2-9.3-27.5-22-35.8-39.6c-8.4-17.9-10.1-37.9-6.1-59.2C23.7 116 52.3 91.2 84.8 78.3c13.3-5.3 27.9-8.9 43.2-11V32c0-17.7 14.3-32 32-32z"/></svg>
                        </div>
                    </div>
                    <div>
                        <h2 class="text-[12px] font-bold text-brand mb-3 uppercase">ADDITIONAL CHARGES</h2>
                        <ul class="list-disc custom-list pl-5 space-y-1.5 text-[12px] text-gray-800 font-medium uppercase">
                            <li>ALL ROTTED WOODWORK IS ADDITIONAL $95.00 PER SHEET OF PLYWOOD.</li>
                            <li>1X2 / 2X4 $5.15 LF.</li>
                            <li>1X6 / 1X8 / 1X10 / 1X12 $9.70 LF, IF CEDAR WOOD $12.50 LF.</li>
                            <li>ALL ROTTED METALWORK IS ADDITIONAL FLASHING $18.00/LF AND COUNTER FLASHING $18.00/LF.</li>
                        </ul>
                    </div>
                </div>

                <!-- Homeowner Responsibilities -->
                <div class="flex gap-[1px] mb-[10px]">
                    <div class="mt-0 text-xl flex-shrink-0 w-10 flex justify-center">
                        <svg fill="#f1853b" style="width:100%; height:100%;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Free 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2023 Fonticons, Inc. --><path d="M406.5 399.6C387.4 352.9 341.5 320 288 320H224c-53.5 0-99.4 32.9-118.5 79.6C69.9 362.2 48 311.7 48 256C48 141.1 141.1 48 256 48s208 93.1 208 208c0 55.7-21.9 106.2-57.5 143.6zm-40.1 32.7C334.4 452.4 296.6 464 256 464s-78.4-11.6-110.5-31.7c7.3-36.7 39.7-64.3 78.5-64.3h64c38.8 0 71.2 27.6 78.5 64.3zM256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm0-272a40 40 0 1 1 0-80 40 40 0 1 1 0 80zm-88-40a88 88 0 1 0 176 0 88 88 0 1 0 -176 0z"/></svg>
                    </div>
                    <div>
                        <h2 class="text-[12px] font-bold text-brand mb-3 uppercase">HOMEOWNER RESPONSIBILITIES</h2>
                        <p class="text-[12px] text-gray-800 font-medium uppercase leading-relaxed mt-[2px]">
                            (PLEASE BE AWARE THAT THE HOMEOWNER IS RESPONSIBLE FOR MAKING THE PROPER ARRANGEMENTS TO BE HOME DURING THE ROOFING JOB. WE MUST REPLACE ALL THE NECESSARY WOODWORK WITH SIMILAR MATERIALS AT THE QUOTED PRICES AS THE DECKING CANNOT BE LEFT EXPOSED DUE TO THE RISK FOR WATER INTRUSION.)
                        </p>
                    </div>
                </div>

                <!-- Payment Terms -->
                <div class="flex gap-[1px] mb-[10px]">
                    <div class="mt-0 text-xl flex-shrink-0 w-10 flex justify-center">
                        <svg fill="#f1853b" style="width:100%; height:100%;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><!--! Font Awesome Free 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2023 Fonticons, Inc. --><path d="M64 0C28.7 0 0 28.7 0 64V448c0 35.3 28.7 64 64 64H320c35.3 0 64-28.7 64-64V160H256c-17.7 0-32-14.3-32-32V0H64zM256 0V128H384L256 0zM64 80c0-8.8 7.2-16 16-16h64c8.8 0 16 7.2 16 16s-7.2 16-16 16H80c-8.8 0-16-7.2-16-16zm0 64c0-8.8 7.2-16 16-16h64c8.8 0 16 7.2 16 16s-7.2 16-16 16H80c-8.8 0-16-7.2-16-16zm128 72c8.8 0 16 7.2 16 16v17.3c8.5 1.2 16.7 3.1 24.1 5.1c8.5 2.3 13.6 11 11.3 19.6s-11 13.6-19.6 11.3c-11.1-3-22-5.2-32.1-5.3c-8.4-.1-17.4 1.8-23.6 5.5c-5.7 3.4-8.1 7.3-8.1 12.8c0 3.7 1.3 6.5 7.3 10.1c6.9 4.1 16.6 7.1 29.2 10.9l.5 .1 0 0 0 0c11.3 3.4 25.3 7.6 36.3 14.6c12.1 7.6 22.4 19.7 22.7 38.2c.3 19.3-9.6 33.3-22.9 41.6c-7.7 4.8-16.4 7.6-25.1 9.1V440c0 8.8-7.2 16-16 16s-16-7.2-16-16V422.2c-11.2-2.1-21.7-5.7-30.9-8.9l0 0c-2.1-.7-4.2-1.4-6.2-2.1c-8.4-2.8-12.9-11.9-10.1-20.2s11.9-12.9 20.2-10.1c2.5 .8 4.8 1.6 7.1 2.4l0 0 0 0 0 0c13.6 4.6 24.6 8.4 36.3 8.7c9.1 .3 17.9-1.7 23.7-5.3c5.1-3.2 7.9-7.3 7.8-14c-.1-4.6-1.8-7.8-7.7-11.6c-6.8-4.3-16.5-7.4-29-11.2l-1.6-.5 0 0c-11-3.3-24.3-7.3-34.8-13.7c-12-7.2-22.6-18.9-22.7-37.3c-.1-19.4 10.8-32.8 23.8-40.5c7.5-4.4 15.8-7.2 24.1-8.7V232c0-8.8 7.2-16 16-16z"/></svg>
                    </div>
                    <div>
                        <h2 class="text-[12px] font-bold text-brand mb-3 uppercase">PAYMENT TERMS</h2>
                        <p class="text-[12px] text-gray-800 font-medium uppercase mt-[2px]">
                            PAYMENT TERMS: 50% DEPOSIT & THE BALANCE DUE UPON JOB COMPLETION.
                        </p>
                    </div>
                </div>
            </div>
        </main>

        <!-- Footer / Signatures Box -->
        <div class="px-4 md:px-12 pb-0 mt-auto mb-[8px]">
            <div class="border-[3px] border-brand rounded-[2rem] border-b-0 rounded-b-none pt-[10px] pb-0 px-4 md:px-10">
                <div class="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-end gap-6 md:gap-0">
                    
                    <!-- Company Signature -->
                    <div class="flex flex-col items-center">
                        <h3 class="font-bold text-[17px] mb-8 uppercase">
                            <span class="text-[#333]">THE</span> <span class="text-brand">COMPANY</span>
                        </h3>
                        <div class="w-full max-w-[220px]">
                            ${d("companySignature") ? imgTag(d("companySignature")) : '<div class="border-b-[2px] border-black w-full mb-1"></div>'}
                            <div class="text-center font-bold text-[12px] mb-6">SIGNATURE</div>
                            <div class="border-b-[2px] border-black w-full mb-1 text-center text-sm">${d("companyDate")}</div>
                            <div class="text-center font-bold text-[12px]">DATE</div>
                        </div>
                    </div>
                    
                    <!-- Icon Center -->
                    <div class="flex justify-center px-6 -mt-8">
                        <img src="/iconoempresa.png" class="h-[120px] object-contain" alt="Icon" onerror="this.style.display='none'">
                    </div>
                    
                    <!-- Representative Signature -->
                    <div class="flex flex-col items-center">
                        <h3 class="font-bold text-[17px] mb-8 uppercase">
                            <span class="text-[#333]">THE</span> <span class="text-brand">REPRESENTATIVE</span>
                        </h3>
                        <div class="w-full max-w-[220px]">
                            ${d("representativeSignature") ? imgTag(d("representativeSignature")) : '<div class="border-b-[2px] border-black w-full mb-1"></div>'}
                            <div class="text-center font-bold text-[12px] mb-6">SIGNATURE</div>
                            <div class="border-b-[2px] border-black w-full mb-1 text-center text-sm">${d("representativeDate")}</div>
                            <div class="text-center font-bold text-[12px]">DATE</div>
                        </div>
                    </div>
                    
                </div>
            </div>
        </div>
        
        <!-- Bottom lines -->
        <div class="absolute bottom-0 left-0 w-1/2 h-[8px] bg-brand rounded-r-full z-10"></div>
        <div class="absolute bottom-0 right-0 w-3/4 h-[3px] bg-[#18181b] rounded-l-full z-20"></div>
        
    </div>
</body>
</html>`;
}


export const taperedFields: ContractField[] = [
    { key: "dripEdgeColor", label: "Drip Edge Color", type: "text" },
    { key: "leadBoots2in", label: "2in Lead Boots", type: "text" },
    { key: "leadBoots3in", label: "3in Lead Boots", type: "text" },
    { key: "cobraRidgeVents", label: "Cobra Ridge Vents", type: "text" },
    { key: "offRidgeVents", label: "Off Ridge Vents", type: "text" },
    { key: "exhaustVents", label: "Exhaust Vents", type: "text" },
    { key: "companySignature", label: "Company Signature", type: "signature" },
    { key: "companyDate", label: "Company Date", type: "date" },
    { key: "representativeSignature", label: "Representative Signature", type: "signature" },
    { key: "representativeDate", label: "Representative Date", type: "date" }
];

export function taperedHtml(data: Record<string, string>): string {
    const d = (k: string) => data[k] || "";
    const imgTag = (url: string) => `<img src="${url}" alt="Signature" class="h-[60px] w-auto mx-auto object-contain" />`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tapered System Contract - One Solutions</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        .custom-list li::marker {
            color: #363636;
            font-size: 0.8em;
        }
    </style>
</head>
<body class="bg-white flex justify-center font-sans m-0 p-0">

    <!-- A4 Paper Container -->
    <div class="bg-white w-full max-w-[210mm] shadow-2xl relative overflow-hidden block p-0">
        
        <!-- Header -->
        <header class="relative w-full h-[140px]">
            <!-- Top Left Orange Shape -->
            <div class="absolute top-0 left-0 w-[280px] h-[80px] z-0">
                <svg viewBox="0 0 420 115" class="w-full h-full">
                    <path d="M 0 0 L 330 0 C 400 0, 410 90, 360 115 L 0 115 Z" fill="#f1853b" />
                    <!-- Black circuit lines -->
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

            <!-- Black Line extending to the right (starts after the pill) -->
            <div class="absolute top-[50px] left-[90px] right-[140px] z-0 h-[8px] bg-[#18181b] rounded-r-full"></div>

            <!-- Italic Text above the line -->
            <div class="absolute top-[32px] left-[300px] z-20 text-[#555] italic text-[10px] font-normal tracking-wider">
                QUOTE VALID FOR SEVEN (07) DAYS
            </div>

            <!-- Pill Container -->
            <div class="absolute top-[32px] left-[90px] z-20 rounded-full p-[4px] bg-white shadow-sm">
                <div class="bg-[#262626] text-white font-bold rounded-full py-[12px] px-0 text-[10px] tracking-wide">
                    ONESOLUTIONS COMPANIES LLC
                </div>
            </div>

            <!-- Top Right Orange Lines -->
            <div class="absolute top-2 right-0 w-[180px] h-[60px] z-0">
                <svg viewBox="0 0 180 60" class="w-full h-full">
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

            <!-- Logo -->
            <div class="absolute top-2 right-[70px] z-30 bg-white rounded-full">
                <img src="/logo-company.png" alt="One Solutions Logo" class="h-32 object-contain" onerror="this.style.display='none'">
            </div>
            <!-- Title -->
            <h1 class="absolute top-[105px] left-[105px] z-30 text-[18px] md:text-[22px] font-black tracking-wide">
                <span class="text-brand">TAPERED SYSTEM</span> <span class="text-dark">CONTRACT</span>
            </h1>
        </header>

        <!-- Main Content -->
        <main class="px-4 md:px-12 flex-grow mt-8 mb-[120px]">

            <!-- Sections -->
            <div class="space-y-3">

                <!-- Permits and Inspections -->
                <div class="flex gap-[1px] mb-[10px]">
                    <div class="mt-1 flex-shrink-0 w-10 flex justify-center">
                        <div class="relative inline-block text-brand">
                                <svg fill="#f1853b" style="width:100%; height:100%;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><!--! Font Awesome Free 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2023 Fonticons, Inc. --><path d="M192 0c-41.8 0-77.4 26.7-90.5 64H64C28.7 64 0 92.7 0 128V448c0 35.3 28.7 64 64 64H320c35.3 0 64-28.7 64-64V128c0-35.3-28.7-64-64-64H282.5C269.4 26.7 233.8 0 192 0zm0 64a32 32 0 1 1 0 64 32 32 0 1 1 0-64zM72 272a24 24 0 1 1 48 0 24 24 0 1 1 -48 0zm104-16H304c8.8 0 16 7.2 16 16s-7.2 16-16 16H176c-8.8 0-16-7.2-16-16s7.2-16 16-16zM72 368a24 24 0 1 1 48 0 24 24 0 1 1 -48 0zm88 0c0-8.8 7.2-16 16-16H304c8.8 0 16 7.2 16 16s-7.2 16-16 16H176c-8.8 0-16-7.2-16-16z"/></svg>
                        </div>
                    </div>
                    <div>
                        <h2 class="text-[12px] font-bold text-brand mb-3 uppercase">PERMITS AND INSPECTIONS</h2>
                        <ul class="list-disc custom-list pl-5 space-y-[5px] text-[12px] text-gray-800 font-medium">
                            <li>The Roofing Factory will obtain and schedule all permits and inspections.</li>
                            <li>Remove one layer of existing roof and underlayment to expose decking.</li>
                            <li>Replace any rotten wood and rusty metal to meet code (Not Painted). ~SEE PRICE DETAILS BELOW</li>
                            <li>Re-nail entire decking to code to meet code specifications.</li>
                            <li>Roof Installation.</li>
                            <li>Install one Layer of Owens Corning DeckSeal Self-Adhered Base (Roof System Underlayment) as a dry in application per 2023 FL BLDG Code.</li>
                            <li>Install 2½ in. drip edge around perimeter of the roof. COLOR: ${d("dripEdgeColor")}</li>
                            <li>Install new (<span class="text-brand">${d("leadBoots2in")}</span>) 2in. & (<span class="text-brand">${d("leadBoots3in")}</span>) 3in. lead boots.</li>
                            <li>Install (<span class="text-brand">${d("cobraRidgeVents")}</span>) new (cobra ridge) vents and/or (<span class="text-brand">${d("offRidgeVents")}</span>) new (off ridge) vents.</li>
                            <li>Install (<span class="text-brand">${d("exhaustVents")}</span>) new exhaust vents.</li>
                            <li>Install one Layer of Owens Corning DeckSeal, Self-Adhered Roofing System (CAP SHEET).</li>
                            <li>Remove all debris and dispose of it properly.</li>
                            <li>Conduct a magnetic sweep of the yard and driveway.</li>
                            <li>The price includes the specified roofing materials, the cost of the specified labor, taxes, and permits fees (if applicable).</li>
                        </ul>
                    </div>
                </div>

                <!-- Warranty -->
                <div class="flex gap-[1px] mb-[10px]">
                    <div class="mt-0 text-xl flex-shrink-0 w-10 flex justify-center">
                        <svg fill="#f1853b" style="width:100%; height:100%;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Free 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2023 Fonticons, Inc. --><path d="M256 48a208 208 0 1 1 0 416 208 208 0 1 1 0-416zm0 464A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-111 111-47-47c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l64 64c9.4 9.4 24.6 9.4 33.9 0L369 209z"/></svg>
                    </div>
                    <div>
                        <h2 class="text-[12px] font-bold text-brand mb-3 uppercase">WARRANTY</h2>
                        <p class="text-[12px] text-gray-800 font-medium uppercase mt-[2px]">
                            MATERIAL WARRANTY AS PROVIDED BY MANUFACTURERS & FIVE (5) YEAR WORKMANSHIP FROM FINAL PAYMENT.
                        </p>
                    </div>
                </div>

                <!-- Additional Charges -->
                <div class="flex gap-[1px] mb-[10px]">
                    <div class="mt-0 flex-shrink-0 w-10 flex justify-center">
                        <div class="border-[2px] border-brand rounded-full w-[28px] h-[28px] flex items-center justify-center text-brand mt-[2px]">
                             <svg fill="#f1853b" style="width:100%; height:100%;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><!--! Font Awesome Free 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2023 Fonticons, Inc. --><path d="M160 0c17.7 0 32 14.3 32 32V67.7c1.6 .2 3.1 .4 4.7 .7c.4 .1 .7 .1 1.1 .2l48 8.8c17.4 3.2 28.9 19.9 25.7 37.2s-19.9 28.9-37.2 25.7l-47.5-8.7c-31.3-4.6-58.9-1.5-78.3 6.2s-27.2 18.3-29 28.1c-2 10.7-.5 16.7 1.2 20.4c1.8 3.9 5.5 8.3 12.8 13.2c16.3 10.7 41.3 17.7 73.7 26.3l2.9 .8c28.6 7.6 63.6 16.8 89.6 33.8c14.2 9.3 27.6 21.9 35.9 39.5c8.5 17.9 10.3 37.9 6.4 59.2c-6.9 38-33.1 63.4-65.6 76.7c-13.7 5.6-28.6 9.2-44.4 11V480c0 17.7-14.3 32-32 32s-32-14.3-32-32V445.1c-.4-.1-.9-.1-1.3-.2l-.2 0 0 0c-24.4-3.8-64.5-14.3-91.5-26.3c-16.1-7.2-23.4-26.1-16.2-42.2s26.1-23.4 42.2-16.2c20.9 9.3 55.3 18.5 75.2 21.6c31.9 4.7 58.2 2 76-5.3c16.9-6.9 24.6-16.9 26.8-28.9c1.9-10.6 .4-16.7-1.3-20.4c-1.9-4-5.6-8.4-13-13.3c-16.4-10.7-41.5-17.7-74-26.3l-2.8-.7 0 0C119.4 279.3 84.4 270 58.4 253c-14.2-9.3-27.5-22-35.8-39.6c-8.4-17.9-10.1-37.9-6.1-59.2C23.7 116 52.3 91.2 84.8 78.3c13.3-5.3 27.9-8.9 43.2-11V32c0-17.7 14.3-32 32-32z"/></svg>
                        </div>
                    </div>
                    <div>
                        <h2 class="text-[12px] font-bold text-brand mb-3 uppercase">ADDITIONAL CHARGES</h2>
                        <ul class="list-disc custom-list pl-5 space-y-[5px] text-[12px] text-gray-800 font-medium uppercase">
                            <li>ADDITIONAL LAYERS OF SHINGLE WILL COST $30/SQ IF FOUND DURING REMOVAL.</li>
                            <li>ALL ROTTED WOODWORK IS ADDITIONAL $95.00 PER SHEET OF PLYWOOD.</li>
                            <li>1X2 / 2X4 $5.15 LF.</li>
                            <li>1X6 / 1X8 / 1X10 / 1X12 $9.70 LF, IF CEDAR WOOD $12.50 LF.</li>
                            <li>ALL ROTTED METALWORK IS ADDITIONAL FLASHING $18.00/LF AND COUNTER FLASHING $18.00/LF.</li>
                        </ul>
                    </div>
                </div>

                <!-- Homeowner Responsibilities -->
                <div class="flex gap-[1px] mb-[10px]">
                    <div class="mt-0 text-xl flex-shrink-0 w-10 flex justify-center">
                        <svg fill="#f1853b" style="width:100%; height:100%;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Free 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2023 Fonticons, Inc. --><path d="M406.5 399.6C387.4 352.9 341.5 320 288 320H224c-53.5 0-99.4 32.9-118.5 79.6C69.9 362.2 48 311.7 48 256C48 141.1 141.1 48 256 48s208 93.1 208 208c0 55.7-21.9 106.2-57.5 143.6zm-40.1 32.7C334.4 452.4 296.6 464 256 464s-78.4-11.6-110.5-31.7c7.3-36.7 39.7-64.3 78.5-64.3h64c38.8 0 71.2 27.6 78.5 64.3zM256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm0-272a40 40 0 1 1 0-80 40 40 0 1 1 0 80zm-88-40a88 88 0 1 0 176 0 88 88 0 1 0 -176 0z"/></svg>
                    </div>
                    <div>
                        <h2 class="text-[12px] font-bold text-brand mb-3 uppercase">HOMEOWNER RESPONSIBILITIES</h2>
                        <p class="text-[12px] text-gray-800 font-medium uppercase leading-relaxed mt-[2px]">
                            (PLEASE BE AWARE THAT THE HOMEOWNER IS RESPONSIBLE FOR MAKING THE PROPER ARRANGEMENTS TO BE HOME DURING THE ROOFING JOB, WE MUST REPLACE ALL THE NECESSARY WOODWORK WITH SIMILAR MATERIALS AT THE QUOTED PRICES AS THE DECKING CANNOT BE LEFT EXPOSED DUE TO THE RISK FOR WATER INTRUSION).
                        </p>
                    </div>
                </div>

                <!-- Exclusions -->
                <div class="flex gap-[1px] mb-[10px]">
                    <div class="mt-0 text-xl flex-shrink-0 w-10 flex justify-center">
                        <svg fill="#f1853b" style="width:100%; height:100%;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Free 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2023 Fonticons, Inc. --><path d="M367.2 412.5L99.5 144.8C77.1 176.1 64 214.5 64 256c0 106 86 192 192 192c41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3C434.9 335.9 448 297.5 448 256c0-106-86-192-192-192c-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256z"/></svg>
                    </div>
                    <div>
                        <h2 class="text-[12px] font-bold text-brand mb-3 uppercase">EXCLUSIONS</h2>
                        <ul class="list-disc custom-list pl-5 space-y-[5px] text-[12px] text-gray-800 font-medium">
                            <li>Does not include stucco, siding or painting repair work where deteriorated L-flashing had to be replaced.</li>
                            <li>Does not include solar panels, gutters, or skylights. Unless otherwise stipulated, we will detach and reset existing skylights and/or gutters.</li>
                        </ul>
                    </div>
                </div>

                <!-- Payment Terms -->
                <div class="flex gap-[1px] mb-[100px]">
                    <div class="mt-0 text-xl flex-shrink-0 w-10 flex justify-center">
                        <svg fill="#f1853b" style="width:100%; height:100%;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><!--! Font Awesome Free 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2023 Fonticons, Inc. --><path d="M64 0C28.7 0 0 28.7 0 64V448c0 35.3 28.7 64 64 64H320c35.3 0 64-28.7 64-64V160H256c-17.7 0-32-14.3-32-32V0H64zM256 0V128H384L256 0zM64 80c0-8.8 7.2-16 16-16h64c8.8 0 16 7.2 16 16s-7.2 16-16 16H80c-8.8 0-16-7.2-16-16zm0 64c0-8.8 7.2-16 16-16h64c8.8 0 16 7.2 16 16s-7.2 16-16 16H80c-8.8 0-16-7.2-16-16zm128 72c8.8 0 16 7.2 16 16v17.3c8.5 1.2 16.7 3.1 24.1 5.1c8.5 2.3 13.6 11 11.3 19.6s-11 13.6-19.6 11.3c-11.1-3-22-5.2-32.1-5.3c-8.4-.1-17.4 1.8-23.6 5.5c-5.7 3.4-8.1 7.3-8.1 12.8c0 3.7 1.3 6.5 7.3 10.1c6.9 4.1 16.6 7.1 29.2 10.9l.5 .1 0 0 0 0c11.3 3.4 25.3 7.6 36.3 14.6c12.1 7.6 22.4 19.7 22.7 38.2c.3 19.3-9.6 33.3-22.9 41.6c-7.7 4.8-16.4 7.6-25.1 9.1V440c0 8.8-7.2 16-16 16s-16-7.2-16-16V422.2c-11.2-2.1-21.7-5.7-30.9-8.9l0 0c-2.1-.7-4.2-1.4-6.2-2.1c-8.4-2.8-12.9-11.9-10.1-20.2s11.9-12.9 20.2-10.1c2.5 .8 4.8 1.6 7.1 2.4l0 0 0 0 0 0c13.6 4.6 24.6 8.4 36.3 8.7c9.1 .3 17.9-1.7 23.7-5.3c5.1-3.2 7.9-7.3 7.8-14c-.1-4.6-1.8-7.8-7.7-11.6c-6.8-4.3-16.5-7.4-29-11.2l-1.6-.5 0 0c-11-3.3-24.3-7.3-34.8-13.7c-12-7.2-22.6-18.9-22.7-37.3c-.1-19.4 10.8-32.8 23.8-40.5c7.5-4.4 15.8-7.2 24.1-8.7V232c0-8.8 7.2-16 16-16z"/></svg>
                    </div>
                    <div>
                        <h2 class="text-[12px] font-bold text-brand mb-3 uppercase">PAYMENT TERMS</h2>
                        <p class="text-[12px] text-gray-800 font-medium uppercase mt-[2px]">
                            PAYMENT TERMS: 50% DEPOSIT & THE BALANCE DUE UPON JOB COMPLETION.
                        </p>
                    </div>
                </div>
            </div>
        </main>

        <!-- Footer / Signatures Box -->
        <div class="px-4 md:px-12 pb-0 mt-auto mb-[8px]">
            <div class="border-[3px] border-brand rounded-[2rem] border-b-0 rounded-b-none pt-[10px] pb-0 px-4 md:px-10">
                <div class="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-end gap-6 md:gap-0">
                    
                    <!-- Company Signature -->
                    <div class="flex flex-col items-center">
                        <h3 class="font-bold text-[17px] mb-8 uppercase">
                            <span class="text-[#333]">THE</span> <span class="text-brand">COMPANY</span>
                        </h3>
                        <div class="w-full max-w-[220px]">
                            ${d("companySignature") ? imgTag(d("companySignature")) : '<div class="signature-line border-b-[2px] border-black w-full mb-1 min-h-[30px]"></div>'}
                            <div class="text-center font-bold text-[12px] mb-6">SIGNATURE</div>
                            <div class="border-b-[2px] border-black w-full mb-1 text-center font-medium">${d("companyDate")}</div>
                            <div class="text-center font-bold text-[12px]">DATE</div>
                        </div>
                    </div>
                    
                    <!-- Icon Center -->
                    <div class="flex justify-center px-6 -mt-8">
                        <img src="/iconoempresa.png" class="h-[120px] object-contain" alt="Icon" onerror="this.style.display='none'">
                    </div>
                    
                    <!-- Representative Signature -->
                    <div class="flex flex-col items-center">
                        <h3 class="font-bold text-[17px] mb-8 uppercase">
                            <span class="text-[#333]">THE</span> <span class="text-brand">REPRESENTATIVE</span>
                        </h3>
                        <div class="w-full max-w-[220px]">
                            ${d("representativeSignature") ? imgTag(d("representativeSignature")) : '<div class="signature-line border-b-[2px] border-black w-full mb-1 min-h-[30px]"></div>'}
                            <div class="text-center font-bold text-[12px] mb-6">SIGNATURE</div>
                            <div class="border-b-[2px] border-black w-full mb-1 text-center font-medium">${d("representativeDate")}</div>
                            <div class="text-center font-bold text-[12px]">DATE</div>
                        </div>
                    </div>
                    
                </div>
            </div>
        </div>
        
        <!-- Bottom lines -->
        <div class="absolute bottom-0 left-0 w-1/2 h-[8px] bg-brand rounded-r-full z-10"></div>
        <div class="absolute bottom-0 right-0 w-3/4 h-[3px] bg-[#18181b] rounded-l-full z-20"></div>
        
    </div>
</body>
</html>`;
}


export const flatRoofingFields: ContractField[] = [
  { key: "dripEdgeColor", label: "Drip Edge Color", type: "text" },
  { key: "twoInchLeadBoots", label: "2in. Lead Boots", type: "text" },
  { key: "threeInchLeadBoots", label: "3in. Lead Boots", type: "text" },
  { key: "exhaustVents", label: "Exhaust Vents", type: "text" },
  { key: "offRidgeVents", label: "Off Ridge Vents", type: "text" },
  { key: "companySignature", label: "Company Signature", type: "signature" },
  { key: "companyDate", label: "Company Date", type: "date" },
  { key: "representativeSignature", label: "Representative Signature", type: "signature" },
  { key: "representativeDate", label: "Representative Date", type: "date" }
];

export function flatRoofingHtml(data: Record<string, string>): string {
  const d = (k: string) => data[k] || "";
  const imgTag = (url: string) => `<img src="${url}" style="max-height: 48px;" />`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Flat Roofing System Contract - One Solutions</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        .custom-list li::marker {
            color: #363636;
            font-size: 0.8em;
        }
    </style>
</head>
<body class="bg-white flex justify-center font-sans m-0 p-0">

    <!-- A4 Paper Container -->
    <div class="bg-white w-full max-w-[210mm] shadow-2xl relative overflow-hidden block p-0">
        
        <!-- Header -->
        <header class="relative w-full h-[140px]">
            <!-- Top Left Orange Shape -->
            <div class="absolute top-0 left-0 w-[280px] h-[80px] z-0">
                <svg viewBox="0 0 420 115" class="w-full h-full">
                    <path d="M 0 0 L 330 0 C 400 0, 410 90, 360 115 L 0 115 Z" fill="#f1853b" />
                    <!-- Black circuit lines -->
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

            <!-- Black Line extending to the right (starts after the pill) -->
            <div class="absolute top-[50px] left-[90px] right-[140px] z-0 h-[8px] bg-[#18181b] rounded-r-full"></div>

            <!-- Italic Text above the line -->
            <div class="absolute top-[32px] left-[300px] z-20 text-[#555] italic text-[10px] font-normal tracking-wider">
                QUOTE VALID FOR SEVEN (07) DAYS
            </div>

            <!-- Pill Container: Placed on top of the black line, with a white gap using padding -->
            <div class="absolute top-[32px] left-[90px] z-20 rounded-full p-[4px] bg-white shadow-sm">
                <div class="bg-[#262626] text-white font-bold rounded-full py-[12px] px-0 text-[10px] tracking-wide">
                    ONESOLUTIONS COMPANIES LLC
                </div>
            </div>

            <!-- Top Right Orange Lines -->
            <div class="absolute top-2 right-0 w-[180px] h-[60px] z-0">
                <svg viewBox="0 0 180 60" class="w-full h-full">
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

            <!-- Logo -->
            <div class="absolute top-2 right-[70px] z-30 bg-white rounded-full">
                <img src="/logo-company.png" alt="One Solutions Logo" class="h-32 object-contain" onerror="this.style.display='none'">
            </div>
            <!-- Title -->
            <h1 class="absolute top-[105px] left-[105px] z-30 text-[18px] md:text-[22px] font-black tracking-wide">
                <span class="text-brand">FLAT ROOFING</span> <span class="text-dark">CONTRACT</span>
            </h1>
        </header>

        <!-- Main Content -->
        <main class="px-4 md:px-12 flex-grow mt-8 mb-[30px]">

            <!-- Sections -->
            <div class="space-y-3">
                
                <!-- Permits and Inspections -->
                <div class="flex gap-[1px] mb-[10px]">
                    <div class="mt-1 flex-shrink-0 w-10 flex justify-center">
                        <div class="relative inline-block text-brand">
                                <svg fill="#f1853b" style="width:100%; height:100%;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><!--! Font Awesome Free 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2023 Fonticons, Inc. --><path d="M192 0c-41.8 0-77.4 26.7-90.5 64H64C28.7 64 0 92.7 0 128V448c0 35.3 28.7 64 64 64H320c35.3 0 64-28.7 64-64V128c0-35.3-28.7-64-64-64H282.5C269.4 26.7 233.8 0 192 0zm0 64a32 32 0 1 1 0 64 32 32 0 1 1 0-64zM72 272a24 24 0 1 1 48 0 24 24 0 1 1 -48 0zm104-16H304c8.8 0 16 7.2 16 16s-7.2 16-16 16H176c-8.8 0-16-7.2-16-16s7.2-16 16-16zM72 368a24 24 0 1 1 48 0 24 24 0 1 1 -48 0zm88 0c0-8.8 7.2-16 16-16H304c8.8 0 16 7.2 16 16s-7.2 16-16 16H176c-8.8 0-16-7.2-16-16z"/></svg>

                        </div>
                    </div>
                    <div>
                        <h2 class="text-[12px] font-bold text-brand mb-3 uppercase">PERMITS AND INSPECTIONS</h2>
                        <ul class="list-disc custom-list pl-5 space-y-1.5 text-[12px] text-gray-800 font-medium">
                            <li>The Roofing Factory will obtain and schedule all necessary permits and inspections.</li>
                            <li>Remove one layer of existing roof and underlayment to expose decking.</li>
                            <li>Replace any rotten wood and rusty metal to meet code (Not Painted). ~SEE PRICE DETAILS BELOW</li>
                            <li>Re-nail entire decking to code.</li>
                            <li>Roof Installation.</li>
                            <li>Install one layer of self-adhered Polyglass Polystick TU PLUS as a dry in application per 2023 FL BLDG Code.</li>
                            <li>Install 2½ In. drip edge around perimeter of the roof with bird stop or anti ponding at eaves and rakes. COLOR: ${d("dripEdgeColor")}</li>
                            <li>Install 26 Gauge 24" formed tile valley.</li>
                            <li>Install new (<span class="text-brand">${d("twoInchLeadBoots")}</span>) 2in. & (<span class="text-brand">${d("threeInchLeadBoots")}</span>) 3in. lead boots.</li>
                            <li>Install (<span class="text-brand">${d("exhaustVents")}</span>) new exhaust vents.</li>
                            <li>Install (<span class="text-brand">${d("offRidgeVents")}</span>) new (off ridge) vents.</li>
                            <li>Install rake and ridge caps. Rake caps fastened with #8 x 2-½" threaded tile roofing fasteners. Ridge end rake caps to be set with tile-tight mortar substitute (tinted to match tile as closely as possible).</li>
                            <li>Install new tiles.</li>
                            <li>Mechanically attach tiles to battens using Quick drive 2½ In. ZINC 1.5m screws.</li>
                            <li>Remove all debris and dispose of it properly.</li>
                            <li>Conduct a magnetic sweep of the yard and driveway.</li>
                            <li>The price includes the specified roofing materials, the cost of the specified labor, taxes, and permits fees (if applicable).</li>
                        </ul>
                    </div>
                </div>

                <!-- Warranty -->
                <div class="flex gap-[1px] mb-[10px]">
                    <div class="mt-0 text-xl flex-shrink-0 w-10 flex justify-center">
                        <svg fill="#f1853b" style="width:100%; height:100%;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Free 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2023 Fonticons, Inc. --><path d="M256 48a208 208 0 1 1 0 416 208 208 0 1 1 0-416zm0 464A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-111 111-47-47c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l64 64c9.4 9.4 24.6 9.4 33.9 0L369 209z"/></svg>
                    </div>
                    <div>
                        <h2 class="text-[12px] font-bold text-brand mb-3 uppercase">WARRANTY</h2>
                        <p class="text-[12px] text-gray-800 font-medium uppercase mt-[2px]">
                            MATERIAL WARRANTY AS PROVIDED BY MANUFACTURER & FIVE (5) YEARS WORKMANSHIP FROM FINAL PAYMENT.
                        </p>
                    </div>
                </div>

                <!-- Additional Charges -->
                <div class="flex gap-[1px] mb-[10px]">
                    <div class="mt-0 flex-shrink-0 w-10 flex justify-center">
                        <div class="border-[2px] border-brand rounded-full w-[28px] h-[28px] flex items-center justify-center text-brand mt-[2px]">
                             <svg fill="#f1853b" style="width:100%; height:100%;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><!--! Font Awesome Free 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2023 Fonticons, Inc. --><path d="M160 0c17.7 0 32 14.3 32 32V67.7c1.6 .2 3.1 .4 4.7 .7c.4 .1 .7 .1 1.1 .2l48 8.8c17.4 3.2 28.9 19.9 25.7 37.2s-19.9 28.9-37.2 25.7l-47.5-8.7c-31.3-4.6-58.9-1.5-78.3 6.2s-27.2 18.3-29 28.1c-2 10.7-.5 16.7 1.2 20.4c1.8 3.9 5.5 8.3 12.8 13.2c16.3 10.7 41.3 17.7 73.7 26.3l2.9 .8c28.6 7.6 63.6 16.8 89.6 33.8c14.2 9.3 27.6 21.9 35.9 39.5c8.5 17.9 10.3 37.9 6.4 59.2c-6.9 38-33.1 63.4-65.6 76.7c-13.7 5.6-28.6 9.2-44.4 11V480c0 17.7-14.3 32-32 32s-32-14.3-32-32V445.1c-.4-.1-.9-.1-1.3-.2l-.2 0 0 0c-24.4-3.8-64.5-14.3-91.5-26.3c-16.1-7.2-23.4-26.1-16.2-42.2s26.1-23.4 42.2-16.2c20.9 9.3 55.3 18.5 75.2 21.6c31.9 4.7 58.2 2 76-5.3c16.9-6.9 24.6-16.9 26.8-28.9c1.9-10.6 .4-16.7-1.3-20.4c-1.9-4-5.6-8.4-13-13.3c-16.4-10.7-41.5-17.7-74-26.3l-2.8-.7 0 0C119.4 279.3 84.4 270 58.4 253c-14.2-9.3-27.5-22-35.8-39.6c-8.4-17.9-10.1-37.9-6.1-59.2C23.7 116 52.3 91.2 84.8 78.3c13.3-5.3 27.9-8.9 43.2-11V32c0-17.7 14.3-32 32-32z"/></svg>
                        </div>
                    </div>
                    <div>
                        <h2 class="text-[12px] font-bold text-brand mb-3 uppercase">ADDITIONAL CHARGES</h2>
                        <p class="text-[12px] text-gray-800 font-medium uppercase leading-relaxed mt-[2px]">
                            ADDITIONAL LAYERS OF SHINGLE WILL COST $30/SQ IF FOUND DURING REMOVAL.<br>
                            ALL ROTTED WOODWORK IS ADDITIONAL $95.00 PER SHEET OF PLYWOOD.<br>
                            1X2 / 2X4 $5.15 LF.<br>
                            1X6 / 1X8 / 1X10 / 1X12 $9.70 LF, IF CEDAR WOOD $12.50 LF.<br>
                            ALL ROTTED METALWORK IS ADDITIONAL FLASHING $18.00/LF AND COUNTER FLASHING $18.00/LF.
                        </p>
                    </div>
                </div>

                <!-- Homeowner Responsibilities -->
                <div class="flex gap-[1px] mb-[10px]">
                    <div class="mt-0 text-xl flex-shrink-0 w-10 flex justify-center">
                        <svg fill="#f1853b" style="width:100%; height:100%;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Free 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2023 Fonticons, Inc. --><path d="M406.5 399.6C387.4 352.9 341.5 320 288 320H224c-53.5 0-99.4 32.9-118.5 79.6C69.9 362.2 48 311.7 48 256C48 141.1 141.1 48 256 48s208 93.1 208 208c0 55.7-21.9 106.2-57.5 143.6zm-40.1 32.7C334.4 452.4 296.6 464 256 464s-78.4-11.6-110.5-31.7c7.3-36.7 39.7-64.3 78.5-64.3h64c38.8 0 71.2 27.6 78.5 64.3zM256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm0-272a40 40 0 1 1 0-80 40 40 0 1 1 0 80zm-88-40a88 88 0 1 0 176 0 88 88 0 1 0 -176 0z"/></svg>
                    </div>
                    <div>
                        <h2 class="text-[12px] font-bold text-brand mb-3 uppercase">HOMEOWNER RESPONSIBILITIES</h2>
                        <p class="text-[12px] text-gray-800 font-medium uppercase leading-relaxed mt-[2px]">
                            (PLEASE BE AWARE THAT THE HOMEOWNER IS RESPONSIBLE FOR MAKING THE PROPER ARRANGEMENTS TO BE HOME DURING THE ROOFING JOB, WE MUST REPLACE ALL THE NECESSARY WOODWORK WITH SIMILAR MATERIALS AT THE QUOTED PRICES AS THE DECKING CANNOT BE LEFT EXPOSED DUE TO THE RISK FOR WATER INTRUSION).
                        </p>
                    </div>
                </div>

                <!-- Exclusions -->
                <div class="flex gap-[1px] mb-[10px]">
                    <div class="mt-0 text-xl flex-shrink-0 w-10 flex justify-center">
                        <svg fill="#f1853b" style="width:100%; height:100%;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Free 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2023 Fonticons, Inc. --><path d="M367.2 412.5L99.5 144.8C77.1 176.1 64 214.5 64 256c0 106 86 192 192 192c41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3C434.9 335.9 448 297.5 448 256c0-106-86-192-192-192c-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256z"/></svg>
                    </div>
                    <div>
                        <h2 class="text-[12px] font-bold text-brand mb-3 uppercase">EXCLUSIONS</h2>
                        <p class="text-[12px] text-gray-800 font-medium leading-relaxed mt-[2px]">
                            Does not include stucco, siding or painting repair work where deteriorated L-flashing had to be replaced.<br>
                            Does not include solar panels, gutters, or skylights. Unless otherwise stipulated, we will detach and reset existing skylights and/or gutters.
                        </p>
                    </div>
                </div>

                <!-- Payment Terms -->
                <div class="flex gap-[1px] mb-[10px]">
                    <div class="mt-0 text-xl flex-shrink-0 w-10 flex justify-center">
                        <svg fill="#f1853b" style="width:100%; height:100%;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><!--! Font Awesome Free 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2023 Fonticons, Inc. --><path d="M64 0C28.7 0 0 28.7 0 64V448c0 35.3 28.7 64 64 64H320c35.3 0 64-28.7 64-64V160H256c-17.7 0-32-14.3-32-32V0H64zM256 0V128H384L256 0zM64 80c0-8.8 7.2-16 16-16h64c8.8 0 16 7.2 16 16s-7.2 16-16 16H80c-8.8 0-16-7.2-16-16zm0 64c0-8.8 7.2-16 16-16h64c8.8 0 16 7.2 16 16s-7.2 16-16 16H80c-8.8 0-16-7.2-16-16zm128 72c8.8 0 16 7.2 16 16v17.3c8.5 1.2 16.7 3.1 24.1 5.1c8.5 2.3 13.6 11 11.3 19.6s-11 13.6-19.6 11.3c-11.1-3-22-5.2-32.1-5.3c-8.4-.1-17.4 1.8-23.6 5.5c-5.7 3.4-8.1 7.3-8.1 12.8c0 3.7 1.3 6.5 7.3 10.1c6.9 4.1 16.6 7.1 29.2 10.9l.5 .1 0 0 0 0c11.3 3.4 25.3 7.6 36.3 14.6c12.1 7.6 22.4 19.7 22.7 38.2c.3 19.3-9.6 33.3-22.9 41.6c-7.7 4.8-16.4 7.6-25.1 9.1V440c0 8.8-7.2 16-16 16s-16-7.2-16-16V422.2c-11.2-2.1-21.7-5.7-30.9-8.9l0 0c-2.1-.7-4.2-1.4-6.2-2.1c-8.4-2.8-12.9-11.9-10.1-20.2s11.9-12.9 20.2-10.1c2.5 .8 4.8 1.6 7.1 2.4l0 0 0 0 0 0c13.6 4.6 24.6 8.4 36.3 8.7c9.1 .3 17.9-1.7 23.7-5.3c5.1-3.2 7.9-7.3 7.8-14c-.1-4.6-1.8-7.8-7.7-11.6c-6.8-4.3-16.5-7.4-29-11.2l-1.6-.5 0 0c-11-3.3-24.3-7.3-34.8-13.7c-12-7.2-22.6-18.9-22.7-37.3c-.1-19.4 10.8-32.8 23.8-40.5c7.5-4.4 15.8-7.2 24.1-8.7V232c0-8.8 7.2-16 16-16z"/></svg>
                    </div>
                    <div>
                        <h2 class="text-[12px] font-bold text-brand mb-3 uppercase">PAYMENT TERMS</h2>
                        <p class="text-[12px] text-gray-800 font-medium uppercase mt-[2px]">
                            PAYMENT TERMS: 50% DEPOSIT SIGNING THE AGREEMENT & THE BALANCE DUE UPON JOB
                        </p>
                    </div>
                </div>
            </div>
        </main>

        <!-- Footer / Signatures Box -->
        <div class="px-4 md:px-12 pb-0 mt-auto mb-[8px]">
            <div class="border-[3px] border-brand rounded-[2rem] border-b-0 rounded-b-none pt-[10px] pb-0 px-4 md:px-10">
                <div class="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-end gap-6 md:gap-0">
                    
                    <!-- Company Signature -->
                    <div class="flex flex-col items-center">
                        <h3 class="font-bold text-[17px] mb-8 uppercase">
                            <span class="text-[#333]">THE</span> <span class="text-brand">COMPANY</span>
                        </h3>
                        <div class="w-full max-w-[220px]">
                            ${d("companySignature") ? imgTag(d("companySignature")) : '<div class="border-b-[2px] border-black w-full mb-1"></div>'}
                            <div class="text-center font-bold text-[12px] mb-6">SIGNATURE</div>
                            ${d("companyDate") ? `<div class="text-center border-b-[2px] border-black w-full mb-1">${d("companyDate")}</div>` : '<div class="border-b-[2px] border-black w-full mb-1"></div>'}
                            <div class="text-center font-bold text-[12px]">DATE</div>
                        </div>
                    </div>
                    
                    <!-- Icon Center -->
                    <div class="flex justify-center px-6 -mt-8">
                        <img src="/iconoempresa.png" class="h-[120px] object-contain" alt="Icon" onerror="this.style.display='none'">
                    </div>
                    
                    <!-- Representative Signature -->
                    <div class="flex flex-col items-center">
                        <h3 class="font-bold text-[17px] mb-8 uppercase">
                            <span class="text-[#333]">THE</span> <span class="text-brand">REPRESENTATIVE</span>
                        </h3>
                        <div class="w-full max-w-[220px]">
                            ${d("representativeSignature") ? imgTag(d("representativeSignature")) : '<div class="border-b-[2px] border-black w-full mb-1"></div>'}
                            <div class="text-center font-bold text-[12px] mb-6">SIGNATURE</div>
                            ${d("representativeDate") ? `<div class="text-center border-b-[2px] border-black w-full mb-1">${d("representativeDate")}</div>` : '<div class="border-b-[2px] border-black w-full mb-1"></div>'}
                            <div class="text-center font-bold text-[12px]">DATE</div>
                        </div>
                    </div>
                    
                </div>
            </div>
        </div>
        
        <!-- Bottom lines -->
        <div class="absolute bottom-0 left-0 w-1/2 h-[8px] bg-brand rounded-r-full z-10"></div>
        <div class="absolute bottom-0 right-0 w-3/4 h-[3px] bg-[#18181b] rounded-l-full z-20"></div>
        
    </div>
</body>
</html>`;
}


export const representantesFields: ContractField[] = [
  { key: 'companySignature', label: 'Company Signature', type: 'signature' },
  { key: 'companyDate', label: 'Company Date', type: 'date' },
  { key: 'representativeSignature', label: 'Representative Signature', type: 'signature' },
  { key: 'representativeDate', label: 'Representative Date', type: 'date' }
];

export function representantesHtml(data: Record<string, string>): string {
  const d = (k: string) => data[k] || "";
  const imgTag = (src: string) => `<img src="${src}" class="max-h-[40px]" style="max-height: 40px; margin: 0 auto;" alt="Signature" />`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contrato de Representante - One Solutions</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap');
    
    :root {
        --brand: #f1853b;
        --dark: #18181b;
        --lightbg: #ffffff;
    }
    
    body {
        font-family: 'Montserrat', sans-serif;
        background-color: #ffffff;
        margin: 0;
        padding: 0;
        display: flex;
        justify-content: center;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }
    
    .page-container {
        background-color: var(--lightbg);
        width: 100%;
        max-width: 210mm;
        position: relative;
        overflow: hidden;
        display: block;
    }
    
    header {
        position: relative;
        width: 100%;
        height: 130px;
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
        top: 95px;
        left: 105px;
        z-index: 30;
        font-size: 18px;
        font-weight: 900;
        letter-spacing: 0.025em;
        margin: 0;
        line-height: 1.1;
    }
    
    .text-brand { color: var(--brand); }
    .text-dark { color: var(--dark); }
    
    main {
        padding: 15px 45px;
        flex-grow: 1;
        position: relative;
    }
    
    .main-grid {
        display: flex;
        justify-content: space-between;
    }
    
    .col {
        width: 47%;
    }
    
    .vertical-stripe {
        position: absolute;
        top: 20px;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 8px;
        background-color: var(--brand);
        border-radius: 9999px;
        z-index: 10;
    }
    
    .section-row {
        display: flex;
        gap: 12px;
        margin-bottom: 12px;
    }
    
    .icon-col {
        flex-shrink: 0;
        width: 32px;
        display: flex;
        justify-content: center;
        margin-top: 2px;
    }
    
    .content-col {
        flex-grow: 1;
    }
    
    .section-title {
        font-size: 10px;
        font-weight: 800;
        color: var(--brand);
        margin: 0 0 6px 0;
        text-transform: uppercase;
    }
    
    .content-text {
        font-size: 8px;
        color: #1f2937;
        font-weight: 500;
        margin: 0 0 4px 0;
        line-height: 1.4;
    }
    
    .content-list {
        list-style-type: disc;
        padding-left: 15px;
        margin: 0 0 4px 0;
        font-size: 8px;
        color: #1f2937;
        font-weight: 500;
        line-height: 1.4;
    }
    
    .content-list li {
        margin-bottom: 2px;
    }
    
    .icon-circle-border {
        border: 2px solid var(--brand);
        border-radius: 9999px;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--brand);
    }
    
    .mini-row {
        display: flex;
        justify-content: space-between;
        margin-top: 15px;
        border-top: 1px solid #d1d5db;
        padding-top: 10px;
    }
    
    .mini-col {
        width: 31%;
    }

    .mini-col .section-title {
        font-size: 8px;
        margin-bottom: 4px;
    }
    
    .mini-col .content-text {
        font-size: 6px;
    }
    
    .footer-box {
        padding: 0 48px;
        margin-top: auto;
        margin-bottom: 25px;
        position: relative;
        z-index: 30;
    }
    
    .signature-container {
        border: 3px solid var(--brand);
        border-radius: 32px;
        border-bottom-left-radius: 0;
        border-bottom-right-radius: 0;
        border-bottom: 0;
        padding: 15px 40px 0 40px;
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        background-color: white;
    }
    
    .sig-col {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 200px;
    }
    
    .sig-title {
        font-weight: 800;
        font-size: 14px;
        margin: 0 0 25px 0;
        text-transform: uppercase;
    }
    
    .sig-line {
        border-bottom: 2px solid black;
        width: 100%;
        margin-bottom: 4px;
        min-height: 25px;
        display: flex;
        justify-content: center;
    }
    
    .sig-label {
        text-align: center;
        font-weight: 700;
        font-size: 10px;
        margin-bottom: 15px;
    }
    
    .date-label {
        text-align: center;
        font-weight: 700;
        font-size: 10px;
    }
    
    .footer-logo {
        height: 100px;
        object-fit: contain;
        margin-top: -30px;
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
                <span class="text-brand">CONTRATO DE</span><br>
                <span class="text-dark">REPRESENTANTE DE VENTAS INDEPENDIENTE</span>
            </h1>
        </header>

        <main>
            <div class="vertical-stripe"></div>
            
            <div class="main-grid">
                <!-- Left Column -->
                <div class="col">
                    <div class="section-row">
                        <div class="icon-col">
                            <i class="fa-regular fa-circle-user text-brand" style="font-size:24px;"></i>
                        </div>
                        <div class="content-col">
                            <h2 class="section-title">1. PARTES</h2>
                            <p class="content-text">
                                Este acuerdo se celebra entre ONE SOLUTIONS COMPANIES LLC (en adelante "La Compañía") y el Representante de Ventas Independiente (en adelante "El Representante").<br>
                                Ambas partes acuerdan cumplir con los términos y condiciones establecidos en este documento.
                            </p>
                        </div>
                    </div>

                    <div class="section-row">
                        <div class="icon-col">
                            <i class="fa-regular fa-handshake text-brand" style="font-size:24px;"></i>
                        </div>
                        <div class="content-col">
                            <h2 class="section-title">2. NATURALEZA DEL ACUERDO</h2>
                            <p class="content-text">
                                El Representante actuará como contratista independiente (1099). Este acuerdo constituye a la forma de pago por comisiones.<br>
                                El Representante no tendrá derecho a salario fijo, beneficios laborales, seguro médico, vacaciones pagadas ni otros beneficios típicos de una relación de empleo.
                            </p>
                        </div>
                    </div>

                    <div class="section-row">
                        <div class="icon-col">
                            <i class="fa-regular fa-circle-check text-brand" style="font-size:24px;"></i>
                        </div>
                        <div class="content-col">
                            <h2 class="section-title">3. ALCANCE DE LOS SERVICIOS</h2>
                            <p class="content-text">El Representante realizará actividades de:</p>
                            <ul class="content-list">
                                <li>Prospección de clientes.</li>
                                <li>Generación de leads.</li>
                                <li>Seguimiento y cierre de ventas.</li>
                                <li>Recolección y entrega de documentación requerida.</li>
                                <li>Ventas puerta a puerta (D2D).</li>
                                <li>Presentación de productos y servicios.</li>
                            </ul>
                            <p class="content-text">Los servicios podrán incluir la comercialización de todos los servicios ofrecidos por ONE SOLUTIONS COMPANIES LLC.</p>
                        </div>
                    </div>

                    <div class="section-row">
                        <div class="icon-col">
                            <div class="icon-circle-border">
                                <i class="fa-solid fa-dollar-sign" style="font-size:12px;"></i>
                            </div>
                        </div>
                        <div class="content-col">
                            <h2 class="section-title">4. COMPENSACIÓN</h2>
                            <p class="content-text" style="font-weight:700;">&bull; Redline 2.35$ (cerrador)</p>
                            <p class="content-text">Con 3 ventas SOLARES, el trainee se gradúa y pasa a ser cerrador, accediendo al 100% de la comisión.</p>
                            
                            <p class="content-text" style="font-weight:700; margin-top:6px;">&bull; Ventas realizadas con apoyo de su closer: Split de comisión 50/50.</p>
                            <p class="content-text">Si el trainee realiza una venta con otro closer que no es el suyo, sin previa conversación su 50% de comisión quedará anulada y transferida al closer original. Y el otro 50% al closer que contactó para el cierre de la venta.</p>
                            
                            <p class="content-text" style="font-weight:700; margin-top:6px;">&bull; Nuevos ingresos con experiencia:</p>
                            <p class="content-text">Si ha sido por otro cerrador deberá completar un mínimo de 2 ventas SOLARES aprobadas dentro de ONE SOLUTIONS COMPANIES LLC para acceder al estatus de Cerrador.</p>
                            <ul class="content-list">
                                <li>Durante estas primeras 2 ventas, la comisión será 50/50 con su reclutador.</li>
                                <li>Una vez completadas las 2 ventas solares aprobadas, pasará a recibir el 100% de la comisión correspondiente.</li>
                            </ul>
                            
                            <p class="content-text" style="font-weight:700; margin-top:6px;">Todas las comisiones estarán sujetas a:</p>
                            <div style="display: flex; flex-wrap: wrap; font-size: 8px; font-weight: 500; color: #1f2937;">
                                <div style="width: 50%; margin-bottom: 2px;"><i class="fa-solid fa-check text-brand" style="margin-right:2px;"></i> Aprobación del proyecto.</div>
                                <div style="width: 50%; margin-bottom: 2px;"><i class="fa-solid fa-check text-brand" style="margin-right:2px;"></i> Instalación del proyecto.</div>
                                <div style="width: 50%;"><i class="fa-solid fa-check text-brand" style="margin-right:2px;"></i> Permanencia activa del cliente.</div>
                                <div style="width: 50%;"><i class="fa-solid fa-check text-brand" style="margin-right:2px;"></i> Cumplimiento de las políticas.</div>
                            </div>
                        </div>
                    </div>

                    <div class="section-row">
                        <div class="icon-col">
                            <i class="fa-regular fa-credit-card text-brand" style="font-size:24px;"></i>
                        </div>
                        <div class="content-col">
                            <h2 class="section-title">5. FORMA DE PAGO</h2>
                            <p class="content-text">Las comisiones serán pagadas una vez que el proyecto alcance el estado de NTP (Notice to Proceed) aprobado por la entidad financiera correspondiente.</p>
                            <p class="content-text" style="font-weight:700;">Solar:</p>
                            <ul class="content-list" style="list-style-type: none; padding-left: 0;">
                                <li>&bull; M1: $1,500 quince (15) días después del NTP completo.</li>
                                <li>&bull; M2: 80% quince (15) días después de la instalación.</li>
                                <li>&bull; M3: 20% luego de haberse firmado la interconexión y el proyecto esté en PTO. (Si hay algún electrical upgrade se tomará del 20% de la comisión restante).</li>
                            </ul>
                            <p class="content-text">No se generará pago de comisión cuando:</p>
                            <ul class="content-list">
                                <li>El cliente cancele el proyecto.</li>
                                <li>El proyecto sea rechazado.</li>
                                <li>El proyecto no llegue a completarse.</li>
                                <li>Exista información falsa o documentación fraudulenta.</li>
                            </ul>
                        </div>
                    </div>

                    <div class="section-row">
                        <div class="icon-col">
                            <i class="fa-solid fa-clipboard-list text-brand" style="font-size:24px;"></i>
                        </div>
                        <div class="content-col">
                            <h2 class="section-title">6. RESPONSABILIDADES DEL REPRESENTANTE</h2>
                            <p class="content-text">El Representante acepta:</p>
                            <ul class="content-list">
                                <li>Actuar con honestidad, profesionalismo y ética.</li>
                                <li>Representar adecuadamente la imagen de la compañía.</li>
                                <li>Cumplir con todos los procedimientos internos.</li>
                                <li>Presentar documentación completa y precisa.</li>
                                <li>Mantener una comunicación profesional con los clientes y compañeros de equipo.</li>
                                <li>Cumplir con las metas mínimas de actividad establecidas por la compañía.</li>
                            </ul>
                            <p class="content-text">Cualquier incumplimiento de las responsabilidades anteriormente mencionadas será motivo para la terminación inmediata de este acuerdo.</p>
                        </div>
                    </div>
                </div>

                <!-- Right Column -->
                <div class="col">
                    <div class="section-row">
                        <div class="icon-col">
                            <i class="fa-solid fa-lock text-brand" style="font-size:24px;"></i>
                        </div>
                        <div class="content-col">
                            <h2 class="section-title">7. CONFIDENCIALIDAD</h2>
                            <p class="content-text">El Representante se compromete a mantener estricta confidencialidad sobre:</p>
                            <ul class="content-list">
                                <li>Información de clientes.</li>
                                <li>Estrategias comerciales.</li>
                                <li>Estructuras de precios.</li>
                                <li>Bases de datos.</li>
                                <li>Procesos internos.</li>
                                <li>Material de entrenamiento.</li>
                            </ul>
                            <p class="content-text">Esta obligación continuará vigente incluso después de finalizada la relación contractual.</p>
                        </div>
                    </div>

                    <div class="section-row">
                        <div class="icon-col">
                            <i class="fa-solid fa-ban text-brand" style="font-size:24px;"></i>
                        </div>
                        <div class="content-col">
                            <h2 class="section-title">8. NO COMPETENCIA</h2>
                            <p class="content-text">Durante la vigencia del presente acuerdo, el Representante no podrá utilizar información obtenida a través de la compañía para beneficio propio o de terceros.</p>
                            <p class="content-text">Asimismo, no podrá desviar clientes, oportunidades comerciales o información estratégica perteneciente a la compañía.</p>
                        </div>
                    </div>

                    <div class="section-row">
                        <div class="icon-col">
                            <i class="fa-solid fa-hand-holding-dollar text-brand" style="font-size:24px;"></i>
                        </div>
                        <div class="content-col">
                            <h2 class="section-title">9. CHARGEBACK Y PAGOS PENDIENTES</h2>
                            <p class="content-text">El Representante será responsable de reembolsar cualquier comisión previamente pagada cuando el proyecto sea cancelado por causas atribuibles a su gestión, información incorrecta, omisiones relevantes o incumplimientos de políticas.</p>
                            <p class="content-text" style="font-weight:700;">La Compañía podrá:</p>
                            <ul class="content-list">
                                <li>Descontar dichos montos de futuras comisiones.</li>
                                <li>Solicitar el reembolso directo.</li>
                                <li>Iniciar acciones legales para la recuperación de fondos.</li>
                            </ul>
                            <p class="content-text">En caso de incumplimiento, la deuda podrá ser remitida a agencias de cobro autorizadas en el Estado de Florida.</p>
                        </div>
                    </div>

                    <div class="section-row">
                        <div class="icon-col">
                            <i class="fa-solid fa-list-check text-brand" style="font-size:24px;"></i>
                        </div>
                        <div class="content-col">
                            <h2 class="section-title">10. REQUISITOS DE PERMANENCIA ACTIVA</h2>
                            <p class="content-text">Con el propósito de mantener una participación activa dentro de la organización, el Representante deberá cumplir con los siguientes requisitos:</p>
                            
                            <p class="content-text" style="font-weight:700; color:var(--brand);">A Participación Obligatoria en Blitz grupales</p>
                            <p class="content-text">El Representante deberá asistir como mínimo a un (1) Blitz semanal organizado por la compañía.<br>La participación en los Blitz constituye una actividad esencial para el desarrollo comercial, generación de oportunidades y crecimiento profesional del Representante.<br>La falta reiterada de participación podrá ser considerada motivo de suspensión o inactivación.</p>
                            
                            <p class="content-text" style="font-weight:700; color:var(--brand); margin-top:4px;">B Producción Mínima Mensual</p>
                            <p class="content-text">El Representante deberá generar un mínimo de una (1) venta aprobada por mes calendario para mantener su condición activa dentro de la compañía.<br>La falta de cumplimiento podrá resultar en revisión de estatus, suspensión temporal o terminación de la relación comercial.</p>
                            
                            <p class="content-text" style="font-weight:700; color:var(--brand); margin-top:4px;">C Reporte Semanal Obligatorio</p>
                            <p class="content-text">Se discutirá reporte semanal personalmente, el periodo semanal será comprendido desde el jueves hasta el miércoles de cada semana.<br>La omisión reiterada de reportes podrá ser considerada incumplimiento contractual.</p>
                            
                            <p class="content-text" style="font-weight:700; color:var(--brand); margin-top:4px;">D Capacitaciones y Reuniones</p>
                            <p class="content-text">La asistencia a capacitaciones, reuniones corporativas, entrenamientos, Zooms y Meetings oficiales de la compañía es obligatoria. La ausencia sin circunstancias justificadas cuando exista una causa justificada y esta sea comunicada previamente a la administración o gerencia correspondiente.</p>
                        </div>
                    </div>

                    <div class="section-row">
                        <div class="icon-col">
                            <i class="fa-solid fa-file-excel text-brand" style="font-size:24px;"></i>
                        </div>
                        <div class="content-col">
                            <h2 class="section-title">11. TERMINACIÓN</h2>
                            <p class="content-text">La Compañía podrá terminar este acuerdo de manera inmediata por:</p>
                            <div style="display:flex;">
                                <ul class="content-list" style="width:50%;">
                                    <li>Fraude.</li>
                                    <li>Conducta inapropiada.</li>
                                </ul>
                                <ul class="content-list" style="width:50%;">
                                    <li>Incumplimiento de políticas.</li>
                                    <li>Falsificación de documentos.</li>
                                </ul>
                            </div>
                            <ul class="content-list">
                                <li>Incumplimiento de cualquiera de las cláusulas establecidas en este contrato.</li>
                            </ul>
                            <p class="content-text" style="margin-top:2px; font-style:italic;">El Representante podrá finalizar este acuerdo en cualquier momento mediante notificación escrita.</p>
                        </div>
                    </div>

                    <!-- Mini Row 12, 13, 14 -->
                    <div class="mini-row">
                        <!-- 12 -->
                        <div class="mini-col">
                            <div style="display:flex; gap:6px;">
                                <div style="flex-shrink:0;">
                                    <i class="fa-solid fa-file-invoice text-brand" style="font-size:18px;"></i>
                                </div>
                                <div>
                                    <div class="section-title">12. IMPUESTOS</div>
                                    <div class="content-text">El Representante reconoce que es responsable de declarar y pagar sus propios impuestos como contratista independiente. La Compañía no realizará retenciones fiscales ni aportes de seguridad social.</div>
                                </div>
                            </div>
                        </div>
                        <!-- 13 -->
                        <div class="mini-col">
                            <div style="display:flex; gap:6px;">
                                <div style="flex-shrink:0;">
                                    <i class="fa-solid fa-scale-balanced text-brand" style="font-size:18px;"></i>
                                </div>
                                <div>
                                    <div class="section-title">13. LEY APLICABLE</div>
                                    <div class="content-text">Este contrato será interpretado y regido conforme a las leyes del Estado de Florida.</div>
                                </div>
                            </div>
                        </div>
                        <!-- 14 -->
                        <div class="mini-col">
                            <div style="display:flex; gap:6px;">
                                <div style="flex-shrink:0;">
                                    <i class="fa-solid fa-user-tie text-brand" style="font-size:18px;"></i>
                                </div>
                                <div>
                                    <div class="section-title">14. CONDUCTA PROFESIONAL</div>
                                    <div class="content-text">El Representante deberá:</div>
                                    <ul class="content-list" style="list-style-type:none; padding-left:0; margin-top:2px;">
                                        <li>&bull; Mantener una apariencia profesional.</li>
                                        <li>&bull; Tratar a los clientes con respeto.</li>
                                        <li>&bull; Actuar con honestidad.</li>
                                        <li>&bull; Proteger la reputación de la compañía.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div style="clear:both;"></div>
            
        </main>

        <div class="footer-box">
            <div class="signature-container">
                
                <div class="sig-col">
                    <h3 class="sig-title"><span class="text-dark">THE</span> <span class="text-brand">COMPANY</span></h3>
                    <div style="width:100%;">
                        ${d("companySignature") ? `<div class="sig-line">${imgTag(d("companySignature"))}</div>` : `<div class="sig-line"></div>`}
                        <div class="sig-label">SIGNATURE</div>
                        ${d("companyDate") ? `<div class="sig-line" style="font-weight:700; font-size:14px; min-height:20px; align-items:flex-end; padding-bottom:2px;">${d("companyDate")}</div>` : `<div class="sig-line" style="min-height:20px;"></div>`}
                        <div class="date-label">DATE</div>
                    </div>
                </div>
                
                <div>
                    <img src="/iconoempresa.png" class="footer-logo" alt="Icon" onerror="this.style.display='none'">
                </div>
                
                <div class="sig-col">
                    <h3 class="sig-title"><span class="text-dark">THE</span> <span class="text-brand">REPRESENTATIVE</span></h3>
                    <div style="width:100%;">
                        ${d("representativeSignature") ? `<div class="sig-line">${imgTag(d("representativeSignature"))}</div>` : `<div class="sig-line"></div>`}
                        <div class="sig-label">SIGNATURE</div>
                        ${d("representativeDate") ? `<div class="sig-line" style="font-weight:700; font-size:14px; min-height:20px; align-items:flex-end; padding-bottom:2px;">${d("representativeDate")}</div>` : `<div class="sig-line" style="min-height:20px;"></div>`}
                        <div class="date-label">DATE</div>
                    </div>
                </div>
                
            </div>
        </div>
        
        <div class="bottom-line-left"></div>
        <div class="bottom-line-right"></div>
        
    </div>
</body>
</html>`;
}


export const w9Fields: ContractField[] = [
  { key: "name", label: "Name", type: "text" },
  { key: "businessName", label: "Business Name", type: "text" },
  { key: "taxClassification", label: "Tax Classification", type: "text" },
  { key: "llcTaxClassification", label: "LLC Tax Classification", type: "text" },
  { key: "otherTaxClassification", label: "Other Tax Classification", type: "text" },
  { key: "hasForeignPartners", label: "Has Foreign Partners", type: "text" },
  { key: "exemptPayeeCode", label: "Exempt Payee Code", type: "text" },
  { key: "fatcaExemptionCode", label: "FATCA Exemption Code", type: "text" },
  { key: "address", label: "Address", type: "text" },
  { key: "cityStateZip", label: "City, State, Zip", type: "text" },
  { key: "requesterNameAddress", label: "Requester Name/Address", type: "text" },
  { key: "accountNumbers", label: "Account Numbers", type: "text" },
  { key: "ssn1", label: "SSN 1", type: "text" },
  { key: "ssn2", label: "SSN 2", type: "text" },
  { key: "ssn3", label: "SSN 3", type: "text" },
  { key: "ssn4", label: "SSN 4", type: "text" },
  { key: "ssn5", label: "SSN 5", type: "text" },
  { key: "ssn6", label: "SSN 6", type: "text" },
  { key: "ssn7", label: "SSN 7", type: "text" },
  { key: "ssn8", label: "SSN 8", type: "text" },
  { key: "ssn9", label: "SSN 9", type: "text" },
  { key: "ein1", label: "EIN 1", type: "text" },
  { key: "ein2", label: "EIN 2", type: "text" },
  { key: "ein3", label: "EIN 3", type: "text" },
  { key: "ein4", label: "EIN 4", type: "text" },
  { key: "ein5", label: "EIN 5", type: "text" },
  { key: "ein6", label: "EIN 6", type: "text" },
  { key: "ein7", label: "EIN 7", type: "text" },
  { key: "ein8", label: "EIN 8", type: "text" },
  { key: "ein9", label: "EIN 9", type: "text" },
  { key: "signatureField", label: "Signature", type: "signature" },
  { key: "date", label: "Date", type: "date" }
];

export function w9Html(data: Record<string, string>): string {
  const d = (k: string) => data[k] || "";
  const imgTag = (url: string) => `<img src="${url}" class="h-8 object-contain" />`;
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Form W-9</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Helvetica+Neue:wght@400;500;700;800&family=Arial:wght@400;700&display=swap');
        
        * {
            box-sizing: border-box;
        }

        body {
            font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            background-color: #ffffff;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
        }

        .w9-container {
            width: 100%;
            max-width: 210mm;
            margin: 0 auto;
            background: white;
            padding: 20px;
            box-sizing: border-box;
        }

        .form-header-grid {
            display: flex;
            justify-content: space-between;
            border-bottom: 2px solid black;
            padding-bottom: 4px;
        }

        .header-title {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 52px;
            font-weight: 800;
            line-height: 0.9;
            letter-spacing: -1px;
        }

        .req-box {
            border: 1px solid black;
            padding: 5px;
            font-size: 13px;
            font-weight: 700;
        }

        .input-line {
            border-top: 1px solid black;
            position: relative;
        }

        .number-box {
            position: absolute;
            left: -1px;
            top: -1px;
            background: transparent;
            font-weight: bold;
            font-size: 14px;
            padding: 2px 4px;
        }

        .form-content {
            border-bottom: 1px solid black;
            padding-left: 20px;
            padding-top: 2px;
            padding-bottom: 2px;
            font-size: 11px;
        }

        .vertical-text-container {
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 25px;
            border-right: 2px solid black;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .vertical-text {
            transform: rotate(-90deg);
            white-space: nowrap;
            font-size: 10px;
            font-weight: bold;
        }
        
        .part-header {
            background-color: black;
            color: white;
            padding: 2px 8px;
            font-size: 15px;
            font-weight: bold;
            display: inline-block;
        }

        .tin-box {
            border: 1px solid black;
            display: inline-flex;
            height: 35px;
        }
        
        .tin-digit {
            width: 24px;
            border-right: 1px solid black;
            text-align: center;
            line-height: 35px;
            font-size: 14px;
        }
        .tin-digit:last-child {
            border-right: none;
        }
        
        .checkbox {
            width: 12px;
            height: 12px;
            border: 1px solid black;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: bold;
            vertical-align: middle;
        }

        .sub-text {
            font-size: 9px;
            line-height: 1.1;
        }
    </style>
</head>
<body>

    <div class="w9-container relative">
        <!-- Header -->
        <div class="form-header-grid">
            <div class="border-r-[2px] border-black pr-2" style="width: 22%; border-right: 2px solid black; padding-right: 8px;">
                <div class="flex items-start gap-1" style="display: flex; align-items: flex-start; gap: 4px;">
                    <span class="text-[13px] font-bold mt-1" style="font-size: 13px; font-weight: bold; margin-top: 4px;">Form</span>
                    <span class="header-title">W-9</span>
                </div>
                <div class="text-[10px] mt-1" style="font-size: 10px; margin-top: 4px;">(Rev. March 2024)</div>
                <div class="text-[9px] mt-3 leading-tight" style="font-size: 9px; margin-top: 12px; line-height: 1.25;">
                    Department of the Treasury<br>
                    Internal Revenue Service
                </div>
            </div>
            <div class="text-center px-4 pt-1 flex flex-col justify-between" style="width: 56%; text-align: center; padding: 4px 16px; display: flex; flex-direction: column; justify-content: space-between;">
                <div class="text-[20px] font-bold leading-tight mt-1" style="font-size: 20px; font-weight: bold; line-height: 1.25; margin-top: 4px;">
                    Request for Taxpayer<br>
                    Identification Number and Certification
                </div>
                <div class="text-[11px] font-bold mb-1" style="font-size: 11px; font-weight: bold; margin-bottom: 4px;">
                    Go to <i class="font-normal" style="font-weight: normal;">www.irs.gov/FormW9</i> for instructions and the latest information.
                </div>
            </div>
            <div class="border-l-[2px] border-black pl-2 flex items-center" style="width: 22%; border-left: 2px solid black; padding-left: 8px; display: flex; align-items: center;">
                <div class="req-box w-full">
                    Give form to the<br>
                    requester. Do not<br>
                    send to the IRS.
                </div>
            </div>
        </div>

        <div class="text-[12px] py-1 border-b-[2px] border-black font-bold">
            Before you begin. <span class="font-normal">For guidance related to the purpose of Form W-9, see <i>Purpose of Form</i>, below.</span>
        </div>

        <!-- Main Form Wrapper with Left Vertical Text -->
        <div class="relative pl-[30px] border-b-[2px] border-black">
            
            <div class="vertical-text-container">
                <div class="vertical-text">
                    <span class="font-bold text-[11px]">Print or type.</span> <span class="font-normal">See <i>Specific Instructions</i> on page 3.</span>
                </div>
            </div>

            <!-- Line 1 -->
            <div class="input-line border-t-0 min-h-[45px]">
                <div class="number-box">1</div>
                <div class="form-content border-b-0">
                    <span class="font-bold">Name of entity/individual.</span> An entry is required. (For a sole proprietor or disregarded entity, enter the owner's name on line 1, and enter the business/disregarded entity's name on line 2.)<br>
                    <div class="mt-4 mb-1 text-base">${d("name")}</div>
                </div>
            </div>

            <!-- Line 2 -->
            <div class="input-line min-h-[30px]">
                <div class="number-box">2</div>
                <div class="form-content border-b-0 h-full flex flex-col pb-1">
                    <span>Business name/disregarded entity name, if different from above.</span>
                    <span class="mt-1 text-base">${d("businessName")}</span>
                </div>
            </div>

            <!-- Line 3 & 4 Container -->
            <div class="flex">
                <!-- Line 3 -->
                <div class="w-[75%] border-r-[1px] border-black">
                    <!-- 3a -->
                    <div class="input-line min-h-[85px] border-r-0">
                        <div class="number-box">3a</div>
                        <div class="form-content border-b-0 h-full">
                            Check the appropriate box for federal tax classification of the entity/individual whose name is entered on line 1. Check<br>
                            <span class="font-bold">only one</span> of the following seven boxes.<br>
                            <div class="flex gap-4 mt-2 mb-1">
                                <label class="flex items-center gap-1"><div class="checkbox">${d("taxClassification") === "Individual/sole proprietor" ? "X" : ""}</div> Individual/sole proprietor</label>
                                <label class="flex items-center gap-1"><div class="checkbox">${d("taxClassification") === "C corporation" ? "X" : ""}</div> C corporation</label>
                                <label class="flex items-center gap-1"><div class="checkbox">${d("taxClassification") === "S corporation" ? "X" : ""}</div> S corporation</label>
                                <label class="flex items-center gap-1"><div class="checkbox">${d("taxClassification") === "Partnership" ? "X" : ""}</div> Partnership</label>
                                <label class="flex items-center gap-1"><div class="checkbox">${d("taxClassification") === "Trust/estate" ? "X" : ""}</div> Trust/estate</label>
                            </div>
                            <div class="flex gap-2 mt-2 items-start mb-1">
                                <label class="flex gap-1 whitespace-nowrap"><div class="checkbox mt-0.5">${d("taxClassification") === "LLC" ? "X" : ""}</div> LLC. Enter the tax classification (C = C corporation, S = S corporation, P = Partnership)</label>
                                <div class="border-b-[1px] border-black w-20 inline-block align-bottom border-dashed text-center">${d("llcTaxClassification")}</div>
                            </div>
                            <div class="sub-text mt-1">
                                <span class="font-bold">Note:</span> Check the “LLC” box above and, in the entry space, enter the appropriate code (C, S, or P) for the tax<br>
                                classification of the LLC, unless it is a disregarded entity. A disregarded entity should instead check the appropriate<br>
                                box for the tax classification of its owner.
                            </div>
                            <div class="flex gap-2 mt-2">
                                <label class="flex items-center gap-1"><div class="checkbox">${d("taxClassification") === "Other" ? "X" : ""}</div> Other (see instructions)</label>
                                <div class="border-b-[1px] border-black flex-grow ml-2 mr-2 border-dashed pl-2">${d("otherTaxClassification")}</div>
                            </div>
                        </div>
                    </div>
                    <!-- 3b -->
                    <div class="input-line min-h-[40px] border-r-0">
                        <div class="number-box">3b</div>
                        <div class="form-content border-b-0 h-full pr-2 flex gap-2">
                            <div class="flex-grow sub-text pt-1">
                                If on line 3a you checked “Partnership” or “Trust/estate,” or checked “LLC” and entered “P” as its tax classification,<br>
                                and you are providing this form to a partnership, trust, or estate in which you have an ownership interest, check<br>
                                this box if you have any foreign partners, owners, or beneficiaries. See instructions <span class="tracking-widest">. . . . . . . . .</span>
                            </div>
                            <div class="flex items-end pb-1"><div class="checkbox">${d("hasForeignPartners") === "true" ? "X" : ""}</div></div>
                        </div>
                    </div>
                </div>

                <!-- Line 4 -->
                <div class="w-[25%] input-line border-t-0 flex flex-col">
                    <div class="number-box">4</div>
                    <div class="form-content border-b-0 h-full pt-1 pl-[20px] flex flex-col justify-between">
                        <div>
                            Exemptions (codes apply only to<br>
                            certain entities, not individuals;<br>
                            see instructions on page 3):
                        </div>
                        
                        <div class="mt-2">
                            <div class="mb-1">Exempt payee code (if any)</div>
                            <div class="border-b-[1px] border-black w-full border-solid text-center">${d("exemptPayeeCode")}</div>
                        </div>
                        
                        <div class="mt-2">
                            <div class="mb-1 leading-tight">Exemption from Foreign Account Tax<br>Compliance Act (FATCA) reporting<br>code (if any)</div>
                            <div class="border-b-[1px] border-black w-full border-solid text-center">${d("fatcaExemptionCode")}</div>
                        </div>
                        
                        <div class="italic text-[10px] text-center mt-2 mb-1">
                            (Applies to accounts maintained<br>outside the United States.)
                        </div>
                    </div>
                </div>
            </div>

            <!-- Line 5 & 6 & Requester -->
            <div class="flex">
                <div class="w-[65%] border-r-[1px] border-black">
                    <!-- Line 5 -->
                    <div class="input-line min-h-[35px]">
                        <div class="number-box">5</div>
                        <div class="form-content border-b-0 h-full flex flex-col pt-1">
                            <span>Address (number, street, and apt. or suite no.). See instructions.</span>
                            <span class="mt-1 text-base">${d("address")}</span>
                        </div>
                    </div>
                    <!-- Line 6 -->
                    <div class="input-line min-h-[35px]">
                        <div class="number-box">6</div>
                        <div class="form-content border-b-0 h-full flex flex-col pt-1">
                            <span>City, state, and ZIP code</span>
                            <span class="mt-1 text-base">${d("cityStateZip")}</span>
                        </div>
                    </div>
                </div>
                <div class="w-[35%] input-line">
                    <div class="form-content border-b-0 h-full pt-1 pl-2 text-[10px] flex flex-col">
                        <span>Requester’s name and address (optional)</span>
                        <span class="mt-1 text-base">${d("requesterNameAddress")}</span>
                    </div>
                </div>
            </div>

            <!-- Line 7 -->
            <div class="input-line min-h-[35px]">
                <div class="number-box">7</div>
                <div class="form-content border-b-0 h-full flex flex-col pt-1">
                    <span>List account number(s) here (optional)</span>
                    <span class="mt-1 text-base">${d("accountNumbers")}</span>
                </div>
            </div>
        </div>

        <!-- Part I -->
        <div class="mt-2 flex">
            <div class="part-header mr-2">Part I</div>
            <div class="font-bold text-[18px]">Taxpayer Identification Number (TIN)</div>
        </div>
        
        <div class="flex gap-4 mt-2">
            <div class="w-[65%] text-[11px] leading-tight">
                Enter your TIN in the appropriate box. The TIN provided must match the name given on line 1 to avoid<br>
                backup withholding. For individuals, this is generally your social security number (SSN). However, for a<br>
                resident alien, sole proprietor, or disregarded entity, see the instructions for Part I, later. For other<br>
                entities, it is your employer identification number (EIN). If you do not have a number, see <i>How to get a<br>
                TIN</i>, later.<br><br>
                <span class="font-bold">Note:</span> If the account is in more than one name, see the instructions for line 1. See also <i>What Name and<br>
                Number To Give the Requester</i> for guidelines on whose number to enter.
            </div>
            
            <div class="w-[35%]">
                <div class="border-[1px] border-black border-b-0 px-2 py-1 font-bold text-[11px]">Social security number</div>
                <div class="flex items-center pl-1 gap-2 border-[1px] border-black border-t-0 pb-1 border-r-0">
                    <div class="tin-box">
                        <div class="tin-digit">${d("ssn1")}</div><div class="tin-digit">${d("ssn2")}</div><div class="tin-digit">${d("ssn3")}</div>
                    </div>
                    <span class="font-bold text-[14px]">-</span>
                    <div class="tin-box">
                        <div class="tin-digit">${d("ssn4")}</div><div class="tin-digit">${d("ssn5")}</div>
                    </div>
                    <span class="font-bold text-[14px]">-</span>
                    <div class="tin-box">
                        <div class="tin-digit">${d("ssn6")}</div><div class="tin-digit">${d("ssn7")}</div><div class="tin-digit">${d("ssn8")}</div><div class="tin-digit">${d("ssn9")}</div>
                    </div>
                </div>

                <div class="font-bold text-[13px] my-1 ml-1">or</div>

                <div class="border-[1px] border-black border-b-0 px-2 py-1 font-bold text-[11px] bg-[#e5e5e5]">Employer identification number</div>
                <div class="flex items-center pl-1 gap-2 border-[1px] border-black border-t-0 pb-1 border-r-0">
                    <div class="tin-box">
                        <div class="tin-digit">${d("ein1")}</div><div class="tin-digit">${d("ein2")}</div>
                    </div>
                    <span class="font-bold text-[14px]">-</span>
                    <div class="tin-box">
                        <div class="tin-digit">${d("ein3")}</div><div class="tin-digit">${d("ein4")}</div><div class="tin-digit">${d("ein5")}</div><div class="tin-digit">${d("ein6")}</div><div class="tin-digit">${d("ein7")}</div><div class="tin-digit">${d("ein8")}</div><div class="tin-digit">${d("ein9")}</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Part II -->
        <div class="mt-4 border-t-[2px] border-black pt-2 flex">
            <div class="part-header mr-2">Part II</div>
            <div class="font-bold text-[18px]">Certification</div>
        </div>
        
        <div class="text-[11px] leading-[1.3] mt-2">
            Under penalties of perjury, I certify that:<br>
            1. The number shown on this form is my correct taxpayer identification number (or I am waiting for a number to be issued to me); and<br>
            2. I am not subject to backup withholding because (a) I am exempt from backup withholding, or (b) I have not been notified by the Internal Revenue<br>
            <span class="pl-3 block">Service (IRS) that I am subject to backup withholding as a result of a failure to report all interest or dividends, or (c) the IRS has notified me that I am</span><br>
            <span class="pl-3 block -mt-2">no longer subject to backup withholding; and</span><br>
            3. I am a U.S. citizen or other U.S. person (defined below); and<br>
            4. The FATCA code(s) entered on this form (if any) indicating that I am exempt from FATCA reporting is correct.<br>
            <div class="mt-2">
                <span class="font-bold">Certification instructions.</span> You must cross out item 2 above if you have been notified by the IRS that you are currently subject to backup withholding<br>
                because you have failed to report all interest and dividends on your tax return. For real estate transactions, item 2 does not apply. For mortgage interest paid,<br>
                acquisition or abandonment of secured property, cancellation of debt, contributions to an individual retirement arrangement (IRA), and, generally, payments<br>
                other than interest and dividends, you are not required to sign the certification, but you must provide your correct TIN. See the instructions for Part II, later.
            </div>
        </div>

        <!-- Sign Here -->
        <div class="border-t-[1px] border-b-[2px] border-black mt-3 flex min-h-[45px] relative">
            <div class="font-bold text-[16px] w-[50px] pt-1 pl-1 leading-tight">
                Sign<br>Here
            </div>
            <div class="flex-grow flex items-end pb-1 pl-2 signature-block">
                <div class="font-bold text-[11px] mr-2 signature-label">Signature of<br>U.S. person</div>
                <i class="fa-solid fa-play text-[10px] mr-2 mb-1"></i>
                <div class="border-b-[1px] border-black w-[400px]">
                    ${d("signatureField") ? imgTag(d("signatureField")) : '<div class="signature-line w-full min-h-[35px]"></div>'}
                </div>
            </div>
            <div class="w-[200px] flex items-end pb-1">
                <div class="font-bold text-[11px] mr-2">Date</div>
                <i class="fa-solid fa-play text-[10px] mr-2 mb-1"></i>
                <div class="border-b-[1px] border-black w-full mr-2 text-center">${d("date")}</div>
            </div>
        </div>
    </div>

        <!-- Instructions footer -->
        <div class="flex mt-3 gap-6">
            <div class="w-1/2">
                <h2 class="text-[20px] font-bold mb-2">General Instructions</h2>
                <p class="text-[11px] mb-2 leading-tight">Section references are to the Internal Revenue Code unless otherwise<br>noted.</p>
                <p class="text-[11px] mb-2 leading-tight"><span class="font-bold">Future developments.</span> For the latest information about developments<br>related to Form W-9 and its instructions, such as legislation enacted<br>after they were published, go to <i>www.irs.gov/FormW9</i>.</p>
                <h3 class="text-[16px] font-bold mb-2 mt-4">What's New</h3>
                <p class="text-[11px] leading-tight">Line 3a has been modified to clarify how a disregarded entity completes<br>this line. An LLC that is a disregarded entity should check the<br>appropriate box for the tax classification of its owner. Otherwise, it<br>should check the “LLC” box and enter its appropriate tax classification.</p>
            </div>
            <div class="w-1/2">
                <p class="text-[11px] leading-tight mb-2">
                    New line 3b has been added to this form. A flow-through entity is<br>
                    required to complete this line to indicate that it has direct or indirect<br>
                    foreign partners, owners, or beneficiaries when it provides the Form W-9<br>
                    to another flow-through entity in which it has an ownership interest. This<br>
                    change is intended to provide a flow-through entity with information<br>
                    regarding the status of its indirect foreign partners, owners, or<br>
                    beneficiaries, so that it can satisfy any applicable reporting<br>
                    requirements. For example, a partnership that has any indirect foreign<br>
                    partners may be required to complete Schedules K-2 and K-3. See the<br>
                    Partnership Instructions for Schedules K-2 and K-3 (Form 1065).
                </p>
                <h3 class="text-[16px] font-bold mb-2 mt-4">Purpose of Form</h3>
                <p class="text-[11px] leading-tight">
                    An individual or entity (Form W-9 requester) who is required to file an<br>
                    information return with the IRS is giving you this form because they
                </p>
            </div>
        </div>
        
        <div class="flex justify-between border-t-[1px] border-black mt-2 pt-1 text-[10px]">
            <div>Cat. No. 10231X</div>
            <div>Form <span class="font-bold">W-9</span> (Rev. 3-2024)</div>
        </div>

    </div>
    <!-- Page 2 -->
    <div class="w9-container relative mt-12">
        <div class="flex justify-between border-b-[2px] border-black pb-1 mb-3 font-bold text-[12px]">
            <div>Form W-9 (Rev. 3-2024)</div>
            <div>Page <span class="text-[16px]">2</span></div>
        </div>
        <div class="columns-2 gap-8 text-[10.5px] leading-snug">
            <p class="mb-2">must obtain your correct taxpayer identification number (TIN), which may be your social security number (SSN), individual taxpayer identification number (ITIN), adoption taxpayer identification number (ATIN), or employer identification number (EIN), to report on an information return the amount paid to you, or other amount reportable on an information return. Examples of information returns include, but are not limited to, the following.</p>
            <ul class="list-disc pl-4 mb-2 space-y-0.5">
                <li>Form 1099-INT (interest earned or paid).</li>
                <li>Form 1099-DIV (dividends, including those from stocks or mutual funds).</li>
                <li>Form 1099-MISC (various types of income, prizes, awards, or gross proceeds).</li>
                <li>Form 1099-NEC (nonemployee compensation).</li>
                <li>Form 1099-B (stock or mutual fund sales and certain other transactions by brokers).</li>
                <li>Form 1099-S (proceeds from real estate transactions).</li>
                <li>Form 1099-K (merchant card and third-party network transactions).</li>
                <li>Form 1098 (home mortgage interest), 1098-E (student loan interest), and 1098-T (tuition).</li>
                <li>Form 1099-C (canceled debt).</li>
                <li>Form 1099-A (acquisition or abandonment of secured property).</li>
            </ul>
            <p class="mb-2">Use Form W-9 only if you are a U.S. person (including a resident alien), to provide your correct TIN.</p>
            <p class="mb-2"><span class="font-bold">Caution:</span> If you don't return Form W-9 to the requester with a TIN, you might be subject to backup withholding. See <i>What is backup withholding</i>, later.</p>
            <p class="font-bold mb-1">By signing the filled-out form, you:</p>
            <ol class="list-decimal pl-4 mb-2 space-y-0.5">
                <li>Certify that the TIN you are giving is correct (or you are waiting for a number to be issued);</li>
                <li>Certify that you are not subject to backup withholding; or</li>
                <li>Claim exemption from backup withholding if you are a U.S. exempt payee; and</li>
                <li>Certify to your non-foreign status for purposes of withholding under chapter 3 or 4 of the Code (if applicable); and</li>
                <li>Certify that FATCA code(s) entered on this form (if any) indicating that you are exempt from the FATCA reporting is correct. See <i>What Is FATCA Reporting</i>, later, for further information.</li>
            </ol>
            <p class="mb-2"><span class="font-bold">Note:</span> If you are a U.S. person and a requester gives you a form other than Form W-9 to request your TIN, you must use the requester’s form if it is substantially similar to this Form W-9.</p>
            <p class="mb-2"><span class="font-bold">Definition of a U.S. person.</span> For federal tax purposes, you are considered a U.S. person if you are:</p>
            <ul class="list-disc pl-4 mb-2 space-y-0.5">
                <li>An individual who is a U.S. citizen or U.S. resident alien;</li>
                <li>A partnership, corporation, company, or association created or organized in the United States or under the laws of the United States;</li>
                <li>An estate (other than a foreign estate); or</li>
                <li>A domestic trust (as defined in Regulations section 301.7701-7).</li>
            </ul>
            <p class="mb-2"><span class="font-bold">Establishing U.S. status for purposes of chapter 3 and chapter 4 withholding.</span> Payments made to foreign persons, including certain distributions, allocations of income, or transfers of sales proceeds, may be subject to withholding under chapter 3 or chapter 4 of the Code (sections 1441–1474). Under those rules, if a Form W-9 or other certification of non-foreign status has not been received, a withholding agent, transferee, or partnership (payor) generally applies presumption rules that may require the payor to withhold applicable tax from the recipient, owner, transferor, or partner (payee). See Pub. 515, Withholding of Tax on Nonresident Aliens and Foreign Entities.</p>
            <p class="mb-2">The following persons must provide Form W-9 to the payor for purposes of establishing its non-foreign status.</p>
            <ul class="list-disc pl-4 mb-2 space-y-0.5">
                <li>In the case of a disregarded entity with a U.S. owner, the U.S. owner of the disregarded entity and not the disregarded entity.</li>
                <li>In the case of a grantor trust with a U.S. grantor or other U.S. owner, generally, the U.S. grantor or other U.S. owner of the grantor trust and not the grantor trust.</li>
                <li>In the case of a U.S. trust (other than a grantor trust), the U.S. trust and not the beneficiaries of the trust.</li>
            </ul>
            <p class="mb-2">See Pub. 515 for more information on providing a Form W-9 or a certification of non-foreign status to avoid withholding.</p>

            <p class="mb-2"><span class="font-bold">Foreign person.</span> If you are a foreign person or the U.S. branch of a foreign bank that has elected to be treated as a U.S. person (under Regulations section 1.1441-1(b)(2)(iv) or other applicable section for chapter 3 or 4 purposes), do not use Form W-9. Instead, use the appropriate Form W-8 or Form 8233 (see Pub. 515). If you are a qualified foreign pension fund under Regulations section 1.897(l)-1(d), or a partnership that is wholly owned by qualified foreign pension funds, that is treated as a non-foreign person for purposes of section 1445 withholding, do not use Form W-9. Instead, use Form W-8EXP (or other certification of non-foreign status).</p>
            <p class="mb-2"><span class="font-bold">Nonresident alien who becomes a resident alien.</span> Generally, only a nonresident alien individual may use the terms of a tax treaty to reduce or eliminate U.S. tax on certain types of income. However, most tax treaties contain a provision known as a saving clause. Exceptions specified in the saving clause may permit an exemption from tax to continue for certain types of income even after the payee has otherwise become a U.S. resident alien for tax purposes.</p>
            <p class="mb-2">If you are a U.S. resident alien who is relying on an exception contained in the saving clause of a tax treaty to claim an exemption from U.S. tax on certain types of income, you must attach a statement to Form W-9 that specifies the following five items.</p>
            <ol class="list-decimal pl-4 mb-2 space-y-0.5">
                <li>The treaty country. Generally, this must be the same treaty under which you claimed exemption from tax as a nonresident alien.</li>
                <li>The treaty article addressing the income.</li>
                <li>The article number (or location) in the tax treaty that contains the saving clause and its exceptions.</li>
                <li>The type and amount of income that qualifies for the exemption from tax.</li>
                <li>Sufficient facts to justify the exemption from tax under the terms of the treaty article.</li>
            </ol>
            <p class="mb-2"><i>Example.</i> Article 20 of the U.S.-China income tax treaty allows an exemption from tax for scholarship income received by a Chinese student temporarily present in the United States. Under U.S. law, this student will become a resident alien for tax purposes if their stay in the United States exceeds 5 calendar years. However, paragraph 2 of the first Protocol to the U.S.-China treaty (dated April 30, 1984) allows the provisions of Article 20 to continue to apply even after the Chinese student becomes a resident alien of the United States. A Chinese student who qualifies for this exception (under paragraph 2 of the first Protocol) and is relying on this exception to claim an exemption from tax on their scholarship or fellowship income would attach to Form W-9 a statement that includes the information described above to support that exemption.</p>
            <p class="mb-2">If you are a nonresident alien or a foreign entity, give the requester the appropriate completed Form W-8 or Form 8233.</p>

            <h2 class="font-bold text-[16px] mb-1 mt-4">Backup Withholding</h2>
            <p class="mb-2"><span class="font-bold">What is backup withholding?</span> Persons making certain payments to you must under certain conditions withhold and pay to the IRS 24% of such payments. This is called “backup withholding.” Payments that may be subject to backup withholding include, but are not limited to, interest, tax-exempt interest, dividends, broker and barter exchange transactions, rents, royalties, nonemployee pay, payments made in settlement of payment card and third-party network transactions, and certain payments from fishing boat operators. Real estate transactions are not subject to backup withholding.</p>
            <p class="mb-2">You will not be subject to backup withholding on payments you receive if you give the requester your correct TIN, make the proper certifications, and report all your taxable interest and dividends on your tax return.</p>
            <p class="font-bold mb-1">Payments you receive will be subject to backup withholding if:</p>
            <ol class="list-decimal pl-4 mb-2 space-y-0.5">
                <li>You do not furnish your TIN to the requester;</li>
                <li>You do not certify your TIN when required (see the instructions for Part II for details);</li>
                <li>The IRS tells the requester that you furnished an incorrect TIN;</li>
                <li>The IRS tells you that you are subject to backup withholding because you did not report all your interest and dividends on your tax return (for reportable interest and dividends only); or</li>
                <li>You do not certify to the requester that you are not subject to backup withholding, as described in item 4 under “By signing the filled-out form” above (for reportable interest and dividend accounts opened after 1983 only).</li>
            </ol>
        </div>
    </div>

    <!-- Page 3 -->
    <div class="w9-container relative mt-12">
        <div class="flex justify-between border-b-[2px] border-black pb-1 mb-3 font-bold text-[12px]">
            <div>Form W-9 (Rev. 3-2024)</div>
            <div>Page <span class="text-[16px]">3</span></div>
        </div>
        <div class="columns-2 gap-8 text-[10.5px] leading-snug">
            <p class="mb-2">Certain payees and payments are exempt from backup withholding. See <i>Exempt payee code</i>, later, and the separate Instructions for the Requester of Form W-9 for more information.</p>
            <p class="mb-2">See also <i>Establishing U.S. status for purposes of chapter 3 and chapter 4 withholding</i>, earlier.</p>
            
            <h2 class="font-bold text-[16px] mb-1">What Is FATCA Reporting?</h2>
            <p class="mb-2">The Foreign Account Tax Compliance Act (FATCA) requires a participating foreign financial institution to report all U.S. account holders that are specified U.S. persons. Certain payees are exempt from FATCA reporting. See <i>Exemption from FATCA reporting code</i>, later, and the Instructions for the Requester of Form W-9 for more information.</p>

            <h2 class="font-bold text-[16px] mb-1">Updating Your Information</h2>
            <p class="mb-2">You must provide updated information to any person to whom you claimed to be an exempt payee if you are no longer an exempt payee and anticipate receiving reportable payments in the future from this person. For example, you may need to provide updated information if you are a C corporation that elects to be an S corporation, or if you are no longer tax exempt. In addition, you must furnish a new Form W-9 if the name or TIN changes for the account, for example, if the grantor of a grantor trust dies.</p>

            <h2 class="font-bold text-[16px] mb-1">Penalties</h2>
            <p class="mb-2"><span class="font-bold">Failure to furnish TIN.</span> If you fail to furnish your correct TIN to a requester, you are subject to a penalty of $50 for each such failure unless your failure is due to reasonable cause and not to willful neglect.</p>
            <p class="mb-2"><span class="font-bold">Civil penalty for false information with respect to withholding.</span> If you make a false statement with no reasonable basis that results in no backup withholding, you are subject to a $500 penalty.</p>
            <p class="mb-2"><span class="font-bold">Criminal penalty for falsifying information.</span> Willfully falsifying certifications or affirmations may subject you to criminal penalties including fines and/or imprisonment.</p>
            <p class="mb-2"><span class="font-bold">Misuse of TINs.</span> If the requester discloses or uses TINs in violation of federal law, the requester may be subject to civil and criminal penalties.</p>

            <h2 class="font-bold text-[22px] mb-2 mt-4">Specific Instructions</h2>
            
            <h3 class="font-bold text-[14px] mb-1">Line 1</h3>
            <p class="mb-2">You must enter one of the following on this line; <span class="font-bold">do not</span> leave this line blank. The name should match the name on your tax return.</p>
            <p class="mb-2">If this Form W-9 is for a joint account (other than an account maintained by a foreign financial institution (FFI)), list first, and then circle, the name of the person or entity whose number you entered in Part I of Form W-9. If you are providing Form W-9 to an FFI to document a joint account, each holder of the account that is a U.S. person must provide a Form W-9.</p>
            <p class="mb-2"><span class="font-bold">&bull; Individual.</span> Generally, enter the name shown on your tax return. If you have changed your last name without informing the Social Security Administration (SSA) of the name change, enter your first name, the last name as shown on your social security card, and your new last name.</p>
            <p class="mb-2"><span class="font-bold">Note for ITIN applicant:</span> Enter your individual name as it was entered on your Form W-7 application, line 1a. This should also be the same as the name you entered on the Form 1040 you filed with your application.</p>
            <p class="mb-2"><span class="font-bold">&bull; Sole proprietor.</span> Enter your individual name as shown on your Form 1040 on line 1. Enter your business, trade, or “doing business as” (DBA) name on line 2.</p>
            <p class="mb-2"><span class="font-bold">&bull; Partnership, C corporation, S corporation, or LLC, other than a disregarded entity.</span> Enter the entity’s name as shown on the entity’s tax return on line 1 and any business, trade, or DBA name on line 2.</p>
            <p class="mb-2"><span class="font-bold">&bull; Other entities.</span> Enter your name as shown on required U.S. federal tax documents on line 1. This name should match the name shown on the charter or other legal document creating the entity. Enter any business, trade, or DBA name on line 2.</p>
            <p class="mb-2"><span class="font-bold">&bull; Disregarded entity.</span> In general, a business entity that has a single owner, including an LLC, and is not a corporation, is disregarded as an entity separate from its owner (a disregarded entity). See Regulations section 301.7701-2(c)(2). A disregarded entity should check the appropriate box for the tax classification of its owner. Enter the owner’s name on line 1. The name of the owner entered on line 1 should never be a disregarded entity. The name on line 1 should be the name shown on the income tax return on which the income should be reported. For example, if a foreign LLC that is treated as a disregarded entity for U.S. federal tax purposes has a single owner that is a U.S. person, the U.S. owner’s name is required to be provided on line 1. If the direct owner of the entity is also a disregarded entity, enter the first owner that is not disregarded for federal tax purposes. Enter the disregarded entity’s name on line 2. If the owner of the disregarded entity is a foreign person, the owner must complete an appropriate Form W-8 instead of a Form W-9. This is the case even if the foreign person has a U.S. TIN.</p>

            <h3 class="font-bold text-[14px] mb-1">Line 2</h3>
            <p class="mb-2">If you have a business name, trade name, DBA name, or disregarded entity name, enter it on line 2.</p>

            <h3 class="font-bold text-[14px] mb-1">Line 3a</h3>
            <p class="mb-2">Check the appropriate box on line 3a for the U.S. federal tax classification of the person whose name is entered on line 1. Check only one box on line 3a.</p>
            
            <table class="w-full border-collapse border border-black mb-4">
                <tr class="bg-gray-100">
                    <th class="border border-black p-1 text-left font-bold w-1/2">IF the entity/individual on line 1 is a(n) . . .</th>
                    <th class="border border-black p-1 text-left font-bold w-1/2">THEN check the box for . . .</th>
                </tr>
                <tr>
                    <td class="border border-black p-1">&bull; Corporation</td>
                    <td class="border border-black p-1">Corporation.</td>
                </tr>
                <tr>
                    <td class="border border-black p-1">&bull; Individual or<br>&bull; Sole proprietorship</td>
                    <td class="border border-black p-1">Individual/sole proprietor.</td>
                </tr>
                <tr>
                    <td class="border border-black p-1">&bull; LLC classified as a partnership for U.S. federal tax purposes or<br>&bull; LLC that has filed Form 8832 or 2553 electing to be taxed as a corporation</td>
                    <td class="border border-black p-1">Limited liability company and enter the appropriate tax classification:<br>P = Partnership,<br>C = C corporation, or<br>S = S corporation.</td>
                </tr>
                <tr>
                    <td class="border border-black p-1">&bull; Partnership</td>
                    <td class="border border-black p-1">Partnership.</td>
                </tr>
                <tr>
                    <td class="border border-black p-1">&bull; Trust/estate</td>
                    <td class="border border-black p-1">Trust/estate.</td>
                </tr>
            </table>

            <h3 class="font-bold text-[14px] mb-1">Line 3b</h3>
            <p class="mb-2">Check this box if you are a partnership (including an LLC classified as a partnership for U.S. federal tax purposes), trust, or estate that has any foreign partners, owners, or beneficiaries, and you are providing this form to a partnership, trust, or estate, in which you have an ownership interest. You must check the box on line 3b if you receive a Form W-8 (or documentary evidence) from any partner, owner, or beneficiary establishing foreign status or if you receive a Form W-9 from any partner, owner, or beneficiary that has checked the box on line 3b.</p>
            <p class="mb-2"><span class="font-bold">Note:</span> A partnership that provides a Form W-9 and checks box 3b may be required to complete Schedules K-2 and K-3 (Form 1065). For more information, see the Partnership Instructions for Schedules K-2 and K-3 (Form 1065).</p>
            <p class="mb-2">If you are required to complete line 3b but fail to do so, you may not receive the information necessary to file a correct information return with the IRS or furnish a correct payee statement to your partners or beneficiaries. See, for example, sections 6698, 6722, and 6724 for penalties that may apply.</p>

            <h3 class="font-bold text-[14px] mb-1">Line 4 Exemptions</h3>
            <p class="mb-2">If you are exempt from backup withholding and/or FATCA reporting, enter in the appropriate space on line 4 any code(s) that may apply to you.</p>
            <p class="font-bold mb-1">Exempt payee code.</p>
            <ul class="list-disc pl-4 mb-2 space-y-0.5">
                <li>Generally, individuals (including sole proprietors) are not exempt from backup withholding.</li>
                <li>Except as provided below, corporations are exempt from backup withholding for certain payments, including interest and dividends.</li>
                <li>Corporations are not exempt from backup withholding for payments made in settlement of payment card or third-party network transactions.</li>
                <li>Corporations are not exempt from backup withholding with respect to attorneys’ fees or gross proceeds paid to attorneys, and corporations that provide medical or health care services are not exempt with respect to payments reportable on Form 1099-MISC.</li>
            </ul>
            <p class="mb-2">The following codes identify payees that are exempt from backup withholding. Enter the appropriate code in the space on line 4.</p>
            <p class="mb-2">1—An organization exempt from tax under section 501(a), any IRA, or a custodial account under section 403(b)(7) if the account satisfies the requirements of section 401(f)(2).</p>
        </div>
    </div>
    
    <!-- Page 4 -->
    <div class="w9-container relative mt-12">
        <div class="flex justify-between border-b-[2px] border-black pb-1 mb-3 font-bold text-[12px]">
            <div>Form W-9 (Rev. 3-2024)</div>
            <div>Page <span class="text-[16px]">4</span></div>
        </div>
        <div class="columns-2 gap-8 text-[10.5px] leading-snug">
            <p class="mb-1">2—The United States or any of its agencies or instrumentalities.</p>
            <p class="mb-1">3—A state, the District of Columbia, a U.S. commonwealth or territory, or any of their political subdivisions or instrumentalities.</p>
            <p class="mb-1">4—A foreign government or any of its political subdivisions, agencies, or instrumentalities.</p>
            <p class="mb-1">5—A corporation.</p>
            <p class="mb-1">6—A dealer in securities or commodities required to register in the United States, the District of Columbia, or a U.S. commonwealth or territory.</p>
            <p class="mb-1">7—A futures commission merchant registered with the Commodity Futures Trading Commission.</p>
            <p class="mb-1">8—A real estate investment trust.</p>
            <p class="mb-1">9—An entity registered at all times during the tax year under the Investment Company Act of 1940.</p>
            <p class="mb-1">10—A common trust fund operated by a bank under section 584(a).</p>
            <p class="mb-1">11—A financial institution as defined under section 581.</p>
            <p class="mb-1">12—A middleman known in the investment community as a nominee or custodian.</p>
            <p class="mb-2">13—A trust exempt from tax under section 664 or described in section 4947.</p>
            
            <p class="mb-2">The following chart shows types of payments that may be exempt from backup withholding. The chart applies to the exempt payees listed above, 1 through 13.</p>
            
            <table class="w-full border-collapse border border-black mb-4">
                <tr class="bg-gray-100">
                    <th class="border border-black p-1 text-left font-bold">IF the payment is for . . .</th>
                    <th class="border border-black p-1 text-left font-bold">THEN the payment is exempt for . . .</th>
                </tr>
                <tr>
                    <td class="border border-black p-1">&bull; Interest and dividend payments</td>
                    <td class="border border-black p-1">All exempt payees except for 7.</td>
                </tr>
                <tr>
                    <td class="border border-black p-1">&bull; Broker transactions</td>
                    <td class="border border-black p-1">Exempt payees 1 through 4 and 6 through 11 and all C corporations. S corporations must not enter an exempt payee code because they are exempt only for sales of noncovered securities acquired prior to 2012.</td>
                </tr>
                <tr>
                    <td class="border border-black p-1">&bull; Barter exchange transactions and patronage dividends</td>
                    <td class="border border-black p-1">Exempt payees 1 through 4.</td>
                </tr>
                <tr>
                    <td class="border border-black p-1">&bull; Payments over $600 required to be reported and direct sales over $5,000</td>
                    <td class="border border-black p-1">Generally, exempt payees 1 through 5.</td>
                </tr>
                <tr>
                    <td class="border border-black p-1">&bull; Payments made in settlement of payment card or third-party network transactions</td>
                    <td class="border border-black p-1">Exempt payees 1 through 4</td>
                </tr>
            </table>

            <div class="mb-4">
                <div class="text-[10px] mb-2 leading-tight">
                    <p><sup>1</sup> See Form 1099-MISC, Miscellaneous Information, and its instructions.</p>
                    <p><sup>2</sup> However, the following payments made to a corporation and reportable on Form 1099-MISC are not exempt from backup withholding: medical and health care payments, attorneys' fees, gross proceeds paid to an attorney reportable under section 6045(f), and payments for services paid by a federal executive agency.</p>
                </div>

                <p class="mb-2"><span class="font-bold">Exemption from FATCA reporting code.</span> The following codes identify payees that are exempt from reporting under FATCA. These codes apply to persons submitting this form for accounts maintained outside of the United States by certain foreign financial institutions. Therefore, if you are only submitting this form for an account you hold in the United States, you may leave this field blank. Consult with the person requesting this form if you are uncertain if the financial institution is subject to these requirements. A requester may indicate that a code is not required by providing you with a Form W-9 with "Not Applicable" (or any similar indication) entered on the line for a FATCA exemption code.</p>

                <div class="pl-2 mb-2 space-y-1">
                    <p>A—An organization exempt from tax under section 501(a) or any individual retirement plan as defined in section 7701(a)(37).</p>
                    <p>B—The United States or any of its agencies or instrumentalities.</p>
                    <p>C—A state, the District of Columbia, a U.S. commonwealth or territory, or any of their political subdivisions or instrumentalities.</p>
                    <p>D—A corporation the stock of which is regularly traded on one or more established securities markets, as described in Regulations section 1.1472-1(c)(1)(i).</p>
                    <p>E—A corporation that is a member of the same expanded affiliated group as a corporation described in Regulations section 1.1472-1(c)(1)(i).</p>
                    <p>F—A dealer in securities, commodities, or derivative financial instruments (including notional principal contracts, futures, forwards, and options) that is registered as such under the laws of the United States or any state.</p>
                    <p>G—A real estate investment trust.</p>
                    <p>H—A regulated investment company as defined in section 851 or an entity registered at all times during the tax year under the Investment Company Act of 1940.</p>
                    <p>I—A common trust fund as defined in section 584(a).</p>
                    <p>J—A bank as defined in section 581.</p>
                    <p>K—A broker.</p>
                    <p>L—A trust exempt from tax under section 664 or described in section 4947(a)(1).</p>
                    <p>M—A tax-exempt trust under a section 403(b) plan or section 457(g) plan.</p>
                </div>

                <p class="mb-2"><span class="font-bold">Note:</span> You may wish to consult with the financial institution requesting this form to determine whether the FATCA code and/or exempt payee code should be completed.</p>
            </div>

            <h3 class="font-bold text-[14px] mb-1">Line 5</h3>
            <p class="mb-2">Enter your address (number, street, and apartment or suite number). This is where the requester of this Form W-9 will mail your information returns. If this address differs from the one the requester already has on file, enter “NEW” at the top.</p>

            <h3 class="font-bold text-[14px] mb-1">Line 6</h3>
            <p class="mb-2">Enter your city, state, and ZIP code.</p>

            <h2 class="font-bold text-[18px] mb-2 mt-4">Part I. Taxpayer Identification Number (TIN)</h2>
            <p class="mb-2"><span class="font-bold">Enter your TIN in the appropriate box.</span> If you are a resident alien and you do not have, and are not eligible to get, an SSN, your TIN is your IRS ITIN. Enter it in the entry space for the Social security number.</p>
            <p class="mb-2">If you are a sole proprietor and you have an EIN, you may enter either your SSN or EIN.</p>
            
            <p class="mb-2"><span class="font-bold">How to get a TIN.</span> If you do not have a TIN, apply for one immediately. To apply for an SSN, get Form SS-5, Application for a Social Security Card, from your local SSA office or get this form online at www.SSA.gov. You may also get this form by calling 800-772-1213. Use Form W-7, Application for IRS Individual Taxpayer Identification Number, to apply for an ITIN, or Form SS-4, Application for Employer Identification Number, to apply for an EIN. You can apply for an EIN online by accessing the IRS website at www.irs.gov/EIN.Go to <em>www.irs.gov/Forms</em> to view, download, or print Form W-7 and/or Form SS-4. Or, you can go to <em>www.irs.gov/OrderForms</em> to place an order and have Form W-7 and/or Form SS-4 mailed to you within 15 business days.</p>
            <p class="mb-2">If you are asked to complete Form W-9 but do not have a TIN, apply for a TIN and enter “Applied For” in the space for the TIN, sign and date the form, and give it to the requester. For interest and dividend payments, and certain payments made with respect to readily tradable instruments, you will generally have 60 days to get a TIN and give it to the requester before you are subject to backup withholding on payments. The 60-day rule does not apply to other types of payments. You will be subject to backup withholding on all such payments until you provide your TIN to the requester.</p>

            <p class="mb-2"><span class="font-bold">Note:</span> Entering “Applied For” means that you have already applied for a TIN or that you intend to apply for one soon. See also <i class="italic">Establishing U.S. status for purposes of chapter 3 and chapter 4 withholding</i>, earlier, for when you may instead be subject to withholding under chapter 3 or 4 of the Code.</p>

            <p class="mb-2"><span class="font-bold">Caution:</span> A disregarded U.S. entity that has a foreign owner must use the appropriate Form W-8.</p>
        </div>
    </div>
    <!-- Page 5 -->
    <div class="w9-container relative mt-12">
        <div class="flex justify-between border-b-[2px] border-black pb-1 mb-3 font-bold text-[12px]">
            <div>Form W-9 (Rev. 3-2024)</div>
            <div>Page <span class="text-[16px]">5</span></div>
        </div>
        <div class="columns-2 gap-8 text-[10.5px] leading-snug">
            <h2 class="font-bold text-[18px] mb-2 mt-2 border-t-[2px] border-black pt-1">Part II. Certification</h2>
            <p class="mb-2">To establish to the withholding agent that you are a U.S. person, or resident alien, sign Form W-9. You may be requested to sign by the withholding agent even if item 1, 4, or 5 below indicates otherwise.</p>
            <p class="mb-2">For a joint account, only the person whose TIN is shown in Part I should sign (when required). In the case of a disregarded entity, the person identified on line 1 must sign. Exempt payees, see <i>Exempt payee code</i>, earlier.</p>
            <p class="mb-2"><span class="font-bold">Signature requirements.</span> Complete the certification as indicated in items 1 through 5 below.</p>
            <p class="mb-2"><span class="font-bold">1. Interest, dividend, and barter exchange accounts opened before 1984 and broker accounts considered active during 1983.</span> You must give your correct TIN, but you do not have to sign the certification.</p>
            <p class="mb-2"><span class="font-bold">2. Interest, dividend, broker, and barter exchange accounts opened after 1983 and broker accounts considered inactive during 1983.</span> You must sign the certification or backup withholding will apply. If you are subject to backup withholding and you are merely providing your correct TIN to the requester, you must cross out item 2 in the certification before signing the form.</p>
            <p class="mb-2"><span class="font-bold">3. Real estate transactions.</span> You must sign the certification. You may cross out item 2 of the certification.</p>
            <p class="mb-2"><span class="font-bold">4. Other payments.</span> You must give your correct TIN, but you do not have to sign the certification unless you have been notified that you have previously given an incorrect TIN. “Other payments” include payments made in the course of the requester’s trade or business for rents, royalties, goods (other than bills for merchandise), medical and health care services (including payments to corporations), payments to a nonemployee for services, payments made in settlement of payment card and third-party network transactions, payments to certain fishing boat crew members and fishermen, and gross proceeds paid to attorneys (including payments to corporations).</p>
            <p class="mb-2"><span class="font-bold">5. Mortgage interest paid by you, acquisition or abandonment of secured property, cancellation of debt, qualified tuition program payments (under section 529), ABLE accounts (under section 529A), IRA, Coverdell ESA, Archer MSA or HSA contributions or distributions, and pension distributions.</span> You must give your correct TIN, but you do not have to sign the certification.</p>
            
            <h2 class="font-bold text-[18px] mb-2 mt-4 border-t-[2px] border-black pt-1">What Name and Number To Give the Requester</h2>
            
            <table class="w-full border-collapse border border-black mb-4 mt-2 text-[9.5px]">
                <tr class="bg-gray-100">
                    <th class="border border-black p-1 text-left font-bold w-1/2">For this type of account:</th>
                    <th class="border border-black p-1 text-left font-bold w-1/2">Give name and SSN of:</th>
                </tr>
                <tr><td class="border border-black p-1">1. Individual</td><td class="border border-black p-1">The individual</td></tr>
                <tr><td class="border border-black p-1">2. Two or more individuals (joint account) other than an account maintained by an FFI</td><td class="border border-black p-1">The actual owner of the account or, if combined funds, the first individual on the account<sup>1</sup></td></tr>
                <tr><td class="border border-black p-1">3. Two or more U.S. persons (joint account maintained by an FFI)</td><td class="border border-black p-1">Each holder of the account</td></tr>
                <tr><td class="border border-black p-1">4. Custodial account of a minor (Uniform Gift to Minors Act)</td><td class="border border-black p-1">The minor<sup>2</sup></td></tr>
                <tr><td class="border border-black p-1">5. a. The usual revocable savings trust (grantor is also trustee)<br>b. So-called trust account that is not a legal or valid trust under state law</td><td class="border border-black p-1">The grantor-trustee<sup>1</sup><br>The actual owner<sup>1</sup></td></tr>
                <tr><td class="border border-black p-1">6. Sole proprietorship or disregarded entity owned by an individual</td><td class="border border-black p-1">The owner<sup>3</sup></td></tr>
                <tr><td class="border border-black p-1">7. Grantor trust filing under Optional Filing Method 1</td><td class="border border-black p-1">The grantor*</td></tr>
            </table>

            <table class="w-full border-collapse border border-black mb-2 text-[9.5px]">
                <tr class="bg-gray-100">
                    <th class="border border-black p-1 text-left font-bold w-1/2">For this type of account:</th>
                    <th class="border border-black p-1 text-left font-bold w-1/2">Give name and EIN of:</th>
                </tr>
                <tr><td class="border border-black p-1">8. Disregarded entity not owned by an individual</td><td class="border border-black p-1">The owner</td></tr>
                <tr><td class="border border-black p-1">9. A valid trust, estate, or pension trust</td><td class="border border-black p-1">Legal entity<sup>4</sup></td></tr>
                <tr><td class="border border-black p-1">10. Corporation or LLC electing corporate status on Form 8832 or Form 2553</td><td class="border border-black p-1">The corporation</td></tr>
                <tr><td class="border border-black p-1">11. Association, club, religious, charitable, educational, or other tax-exempt organization</td><td class="border border-black p-1">The organization</td></tr>
                <tr><td class="border border-black p-1">12. Partnership or multi-member LLC</td><td class="border border-black p-1">The partnership</td></tr>
                <tr><td class="border border-black p-1">13. A broker or registered nominee</td><td class="border border-black p-1">The broker or nominee</td></tr>
                <tr><td class="border border-black p-1">14. Account with the Department of Agriculture in the name of a public entity</td><td class="border border-black p-1">The public entity</td></tr>
                <tr><td class="border border-black p-1">15. Grantor trust filing Form 1041 or under the Optional Filing Method 2</td><td class="border border-black p-1">The trust</td></tr>
            </table>
            
            <p class="mb-1 mt-2 text-[9.5px]"><sup>1</sup> List first and circle the name of the person whose number you furnish. If only one person on a joint account has an SSN, that person’s number must be furnished.</p>
            <p class="mb-1 text-[9.5px]"><sup>2</sup> Circle the minor’s name and furnish the minor’s SSN.</p>
            <p class="mb-1 text-[9.5px]"><sup>3</sup> You must show your individual name on line 1, and enter your business or DBA name, if any, on line 2. You may use either your SSN or EIN (if you have one), but the IRS encourages you to use your SSN.</p>
            <p class="mb-1 text-[9.5px]"><sup>4</sup> List first and circle the name of the trust, estate, or pension trust. (Do not furnish the TIN of the personal representative or trustee unless the legal entity itself is not designated in the account title.)</p>
            <p class="mb-1 text-[9.5px]">* <span class="font-bold">Note:</span> The grantor must also provide a Form W-9 to the trustee of the trust.</p>
            <p class="mb-2 text-[9.5px]"><span class="font-bold">Note:</span> If no name is circled when more than one name is listed, the number will be considered to be that of the first name listed.</p>

            <h2 class="font-bold text-[18px] mb-2 mt-4 border-t-[2px] border-black pt-1">Secure Your Tax Records From Identity Theft</h2>
            <p class="mb-2">Identity theft occurs when someone uses your personal information, such as your name, SSN, or other identifying information, without your permission to commit fraud or other crimes. An identity thief may use your SSN to get a job or may file a tax return using your SSN to receive a refund.</p>
            <p class="mb-1">To reduce your risk:</p>
            <ul class="list-disc pl-4 mb-2 space-y-0.5">
                <li>Protect your SSN,</li>
                <li>Ensure your employer is protecting your SSN, and</li>
                <li>Be careful when choosing a tax return preparer.</li>
            </ul>
            <p class="mb-2">If your tax records are affected by identity theft and you receive a notice from the IRS, respond right away to the name and phone number printed on the IRS notice or letter.</p>
            <p class="mb-2">If your tax records are not currently affected by identity theft but you think you are at risk due to a lost or stolen purse or wallet, questionable credit card activity, or a questionable credit report, contact the IRS Identity Theft Hotline at 800-908-4490 or submit Form 14039.</p>
            <p class="mb-2">For more information, see Pub. 5027, Identity Theft Information for Taxpayers.</p>
        </div>
    </div>

    <!-- Page 6 -->
    <div class="w9-container relative mt-12 mb-12">
        <div class="flex justify-between border-b-[2px] border-black pb-1 mb-3 font-bold text-[12px]">
            <div>Form W-9 (Rev. 3-2024)</div>
            <div>Page <span class="text-[16px]">6</span></div>
        </div>
        <div class="columns-2 gap-8 text-[10.5px] leading-snug">
            <p class="mb-2">Victims of identity theft who are experiencing economic harm or a systemic problem, or are seeking help in resolving tax problems that have not been resolved through normal channels, may be eligible for Taxpayer Advocate Service (TAS) assistance. You can reach TAS by calling the TAS toll-free case intake line at 877-777-4778 or TTY/TDD 800-829-4059.</p>
            <p class="mb-2"><span class="font-bold">Protect yourself from suspicious emails or phishing schemes.</span> Phishing is the creation and use of email and websites designed to mimic legitimate business emails and websites. The most common act is sending an email to a user falsely claiming to be an established legitimate enterprise in an attempt to scam the user into surrendering private information that will be used for identity theft.</p>
            <p class="mb-2">The IRS does not initiate contacts with taxpayers via emails. Also, the IRS does not request personal detailed information through email or ask taxpayers for the PIN numbers, passwords, or similar secret access information for their credit card, bank, or other financial accounts.</p>
            <p class="mb-2">If you receive an unsolicited email claiming to be from the IRS, forward this message to <i>phishing@irs.gov</i>. You may also report misuse of the IRS name, logo, or other IRS property to the Treasury Inspector General for Tax Administration (TIGTA) at 800-366-4484. You can forward suspicious emails to the Federal Trade Commission at <i>spam@uce.gov</i> or report them at <i>www.ftc.gov/complaint</i>. You can contact the FTC at <i>www.ftc.gov/idtheft</i> or 877-IDTHEFT (877-438-4338). If you have been the victim of identity theft, see <i>www.IdentityTheft.gov</i> and Pub. 5027.</p>
            <p class="mb-4">Go to <i>www.irs.gov/IdentityTheft</i> to learn more about identity theft and how to reduce your risk.</p>

            <h2 class="font-bold text-[18px] mb-2 mt-4 border-t-[2px] border-black pt-1">Privacy Act Notice</h2>
            <p class="mb-2">Section 6109 of the Internal Revenue Code requires you to provide your correct TIN to persons (including federal agencies) who are required to file information returns with the IRS to report interest, dividends, or certain other income paid to you; mortgage interest you paid; the acquisition or abandonment of secured property; the cancellation of debt; or contributions you made to an IRA, Archer MSA, or HSA. The person collecting this form uses the information on the form to file information returns with the IRS, reporting the above information. Routine uses of this information include giving it to the Department of Justice for civil and criminal litigation and to cities, states, the District of Columbia, and U.S. commonwealths and territories for use in administering their laws. The information may also be disclosed to other countries under a treaty, to federal and state agencies to enforce civil and criminal laws, or to federal law enforcement and intelligence agencies to combat terrorism. You must provide your TIN whether or not you are required to file a tax return. Under section 3406, payors must generally withhold a percentage of taxable interest, dividends, and certain other payments to a payee who does not give a TIN to the payor. Certain penalties may also apply for providing false or fraudulent information.</p>
        </div>
    </div>
</body>
</body>
</html>`;
}



export const fenceFields: ContractField[] = [
  { key: "clientAddress", label: "Location", type: "text" },
  { key: "clientPhone", label: "Phone", type: "text" },
  { key: "serviceType", label: "Service", type: "text" },
  { key: "paymentTerms", label: "Payments", type: "text" },
  { key: "clientName", label: "Customer Name", type: "text" },
  { key: "clientBillingAddress", label: "Customer Address", type: "text" },
  { key: "customerAddress2", label: "Customer Address 2", type: "text" },
  { key: "date", label: "Customer Date", type: "date" },
  { key: "detailLine1", label: "Detail Line 1", type: "text" },
  { key: "detailLine2", label: "Detail Line 2", type: "text" },
  { key: "detailLine3", label: "Detail Line 3", type: "text" },
  { key: "totalAmount", label: "Total Amount", type: "money" },
  { key: "clientSignature", label: "Client Signature", type: "signature" },
  { key: "signatureDate", label: "Signature Date", type: "date" }
];

export function fenceHtml(data: Record<string, string>): string {
  const d = (k: string) => data[k] || "";
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Fence Agreement - One Solutions</title>
<style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&display=swap');

    :root {
        --brand-orange: #f26522;
        --brand-dark: #111111;
        --bg-light: #ffffff;
    }

    body {
        font-family: 'Montserrat', sans-serif;
        color: var(--brand-dark);
        background-color: var(--bg-light);
        margin: 0;
        padding: 40px;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }

    .document-container {
        max-width: 800px;
        margin: 0 auto;
        position: relative;
    }

    /* Header */
    .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 20px;
    }

    .logo-area {
        width: 45%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }

    .logo-icon {
        width: 100px;
        height: 100px;
        background-color: var(--brand-orange);
        border-radius: 20px;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 10px;
    }

    .logo-icon-inner {
        width: 80px;
        height: 80px;
        background-color: white;
        border-radius: 50%;
        border: 4px solid var(--brand-dark);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 40px;
        font-weight: 900;
        color: var(--brand-dark);
    }

    .brand-text {
        text-align: center;
        line-height: 1;
    }

    .brand-one {
        color: var(--brand-orange);
        font-size: 48px;
        font-weight: 900;
        letter-spacing: -1px;
    }

    .brand-solutions {
        color: var(--brand-dark);
        font-size: 28px;
        font-weight: 900;
        letter-spacing: -1px;
    }

    .brand-companies {
        color: #666;
        font-size: 10px;
        letter-spacing: 4px;
        border-top: 1px solid #ccc;
        padding-top: 4px;
        margin-top: 4px;
    }

    .agreement-area {
        width: 50%;
        padding-left: 20px;
    }

    .agreement-title {
        font-size: 42px;
        font-weight: 900;
        letter-spacing: -1px;
        margin: 0;
        line-height: 1;
    }

    .company-name {
        color: var(--brand-orange);
        font-size: 16px;
        font-weight: 700;
        margin-bottom: 20px;
        margin-top: 5px;
    }

    .contact-row {
        display: flex;
        align-items: flex-end;
        margin-bottom: 15px;
        font-size: 14px;
        font-weight: 600;
    }

    .icon-circle {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background-color: #fde0d3;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin-right: 10px;
        color: var(--brand-orange);
        font-weight: 900;
        font-size: 12px;
    }

    .contact-label {
        min-width: 60px;
    }

    .contact-value {
        flex-grow: 1;
        border-bottom: 1px solid var(--brand-dark);
        min-height: 20px;
        margin-left: 5px;
        padding-bottom: 2px;
    }

    /* Orange Separator */
    .orange-bar {
        height: 6px;
        background-color: var(--brand-orange);
        width: 100%;
        margin-bottom: 0;
    }

    /* Customer Info Box */
    .customer-box {
        background-color: var(--brand-dark);
        color: white;
        padding: 30px;
        display: flex;
        margin-bottom: 30px;
    }

    .customer-left {
        width: 60%;
        border-right: 1px solid #444;
        padding-right: 30px;
    }

    .customer-title {
        color: var(--brand-orange);
        font-size: 16px;
        font-weight: 700;
        margin-bottom: 15px;
        margin-top: 0;
    }

    .customer-row {
        display: flex;
        align-items: flex-end;
        margin-bottom: 15px;
        font-size: 14px;
    }

    .customer-row-label {
        margin-right: 10px;
    }

    .customer-row-value {
        flex-grow: 1;
        border-bottom: 1px solid white;
        min-height: 20px;
        padding-bottom: 2px;
    }

    .customer-right {
        width: 40%;
        padding-left: 30px;
        display: flex;
        align-items: center;
    }
    
    .date-row {
        display: flex;
        align-items: flex-end;
        width: 100%;
        font-size: 18px;
        font-weight: 700;
    }

    /* Details and Total */
    .details-total-container {
        display: flex;
        gap: 30px;
        margin-bottom: 30px;
    }

    .details-box {
        width: 60%;
        border: 2px solid var(--brand-dark);
        border-radius: 15px;
        padding: 20px;
        display: flex;
        flex-direction: column;
        justify-content: space-around;
        min-height: 150px;
    }

    .detail-line {
        border-bottom: 1px solid var(--brand-dark);
        min-height: 25px;
    }

    .total-box {
        width: 40%;
        background-color: var(--brand-dark);
        border-radius: 15px;
        padding: 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }

    .total-title {
        color: var(--brand-orange);
        font-size: 20px;
        font-weight: 700;
        letter-spacing: 2px;
        margin-bottom: 15px;
        margin-top: 0;
    }

    .total-amount-box {
        background-color: white;
        border-radius: 8px;
        width: 90%;
        height: 50px;
        display: flex;
        align-items: center;
        padding: 0 15px;
    }

    .total-symbol {
        color: var(--brand-dark);
        font-size: 24px;
        font-weight: 700;
        margin-right: 10px;
    }

    .total-value {
        color: var(--brand-dark);
        flex-grow: 1;
        border-bottom: 2px solid var(--brand-dark);
        font-size: 20px;
        font-weight: 700;
        text-align: center;
        min-height: 25px;
    }

    /* Divider */
    .divider {
        border-bottom: 1px solid #ddd;
        margin-bottom: 20px;
    }

    /* Warranty */
    .warranty-text {
        font-size: 14px;
        font-weight: 700;
        line-height: 1.6;
        margin-bottom: 30px;
    }

    /* Signature Box */
    .signature-box {
        border: 2px solid var(--brand-dark);
        border-radius: 15px;
        padding: 20px 30px;
        margin-bottom: 40px;
    }

    .signature-title {
        color: var(--brand-orange);
        font-size: 14px;
        font-weight: 700;
        margin-bottom: 40px;
        margin-top: 0;
    }

    .signature-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
    }

    .sig-left {
        width: 65%;
        display: flex;
        align-items: flex-end;
    }
    
    .sig-right {
        width: 30%;
        display: flex;
        align-items: flex-end;
    }

    .sig-x {
        font-size: 20px;
        font-weight: 700;
        margin-right: 10px;
    }

    .sig-line {
        flex-grow: 1;
        border-bottom: 2px solid var(--brand-dark);
        min-height: 30px;
    }
    
    .sig-date-label {
        font-size: 14px;
        font-weight: 700;
        margin-right: 10px;
    }

    /* CSS Fence */
    .fence-container {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        height: 120px;
        overflow: hidden;
        margin-top: 40px;
    }

    .fence-picket {
        width: calc(100% / 22 - 2px);
        height: 100px;
        background: linear-gradient(to right, #e6c8a6, #dcb692, #e6c8a6);
        position: relative;
        border-left: 1px solid #c29871;
        border-right: 1px solid #c29871;
    }
    
    .fence-picket::before {
        content: '';
        position: absolute;
        top: -15px;
        left: -1px;
        width: 0;
        height: 0;
        border-left: calc(100% / 2 + 1px) solid transparent;
        border-right: calc(100% / 2 + 1px) solid transparent;
        border-bottom: 15px solid #dcb692;
    }

    .fence-nail {
        position: absolute;
        width: 4px;
        height: 4px;
        background-color: #8c5e35;
        border-radius: 50%;
        left: 50%;
        transform: translateX(-50%);
    }

    .fence-nail.top { top: 30px; }
    .fence-nail.bottom { top: 70px; }

    .horizontal-beam {
        position: absolute;
        left: 0;
        width: 100%;
        height: 15px;
        background: #c99f7a;
        border-top: 1px solid #a3734a;
        border-bottom: 1px solid #a3734a;
        z-index: -1;
    }

    .horizontal-beam.top { top: 25px; }
    .horizontal-beam.bottom { top: 65px; }

    .footer-bar {
        background-color: var(--brand-dark);
        color: white;
        text-align: center;
        padding: 15px 0;
        font-size: 18px;
        font-weight: 700;
        letter-spacing: 1px;
    }
</style>
</head>
<body>

<div class="document-container">
    <div class="header">
        <div class="logo-area">
            
            <img src="data:image/png;base64,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" alt="Logo" style="max-width: 320px; max-height: 220px; object-fit: contain;" />


        </div>
        <div class="agreement-area">
            <h1 class="agreement-title">AGREEMENT</h1>
            <div class="company-name">One Solutions Companies LLC</div>
            
            <div class="contact-row mt-4">
                <div class="icon-circle">&#9679;</div>
                <div class="contact-value">${d("clientAddress")}</div>
            </div>
            <div class="contact-row">
                <div class="icon-circle">&#9742;</div>
                <div class="contact-label">Phone:</div>
                <div class="contact-value">${d("clientPhone")}</div>
            </div>
            <div class="contact-row">
                <div class="icon-circle">&#9993;</div>
                <div class="contact-label">Service:</div>
                <div class="contact-value">${d("serviceType")}</div>
            </div>
            <div class="contact-row">
                <div class="icon-circle">&#36;</div>
                <div class="contact-label">Payments:</div>
                <div class="contact-value">${d("paymentTerms")}</div>
            </div>
        </div>
    </div>

    <div class="orange-bar"></div>

    <div class="customer-box">
        <div class="customer-left">
            <h3 class="customer-title">Customer Information</h3>
            <div class="customer-row">
                <div class="customer-row-label">Name:</div>
                <div class="customer-row-value">${d("clientName")}</div>
            </div>
            <div class="customer-row">
                <div class="customer-row-label">Address:</div>
                <div class="customer-row-value">${d("clientBillingAddress")}</div>
            </div>
            <div class="customer-row">
                <div class="customer-row-label"></div>
                <div class="customer-row-value">${d("customerAddress2")}</div>
            </div>
        </div>
        <div class="customer-right">
            <div class="date-row">
                <div class="customer-row-label">Date:</div>
                <div class="customer-row-value">${d("date")}</div>
            </div>
        </div>
    </div>

    <div class="details-total-container">
        <div class="details-box">
            <div class="detail-line">${d("detailLine1")}</div>
            <div class="detail-line">${d("detailLine2")}</div>
            <div class="detail-line">${d("detailLine3")}</div>
        </div>
        <div class="total-box">
            <h3 class="total-title">TOTAL</h3>
            <div class="total-amount-box">
                <div class="total-symbol">$</div>
                <div class="total-value">${d("totalAmount")}</div>
            </div>
        </div>
    </div>

    <div class="divider"></div>

    <div class="warranty-text">
        &bull; Lifetime Warranty In Materials & 5 Years Warranty On Labor<br>
        &bull; Warranty Do Not Cover Mother Nature Damages
    </div>

    <div class="signature-box signatures-container">
        <h3 class="signature-title">Client Signature</h3>
        <div class="signature-row">
            <div class="sig-left signature-block">
                <div class="sig-x">X</div>
                ${d("clientSignature") ? `<div class="sig-line" style="display:flex;align-items:flex-end;"><img src="${d("clientSignature")}" style="max-height: 40px; margin-bottom: 4px;" /></div>` : '<div class="sig-line signature-line" style="display:flex;align-items:flex-end;flex:1;min-width:150px;min-height:35px;"></div>'}
                <div class="signature-label" style="display:none;">Client Signature</div>
            </div>
            <div class="sig-right signature-block" style="display:flex;align-items:flex-end;">
                <div class="sig-date-label signature-label" style="margin-right:10px;">Date:</div>
                ${d("signatureDate") ? `<div class="sig-line">${d("signatureDate")}</div>` : '<div class="sig-line signature-line" style="flex:1;min-height:35px;"></div>'}
            </div>
        </div>
    </div>

    <img src="data:image/png;base64,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" alt="Fence" style="width: 100%; object-fit: cover; object-position: bottom; margin-top: 20px;" /><div class="orange-bar"></div>
</div>

</body>
</html>`;
}


const templates: ContractTemplate[] = [
  { projectType: "Techo", name: "Roofing Contract", html: techoHtml, fields: techoFields },
  { projectType: "Purificador de Agua", name: "Water Purification Agreement", html: purificadorAguaHtml, fields: purificadorAguaFields },
  { projectType: "Metal Roof", name: "Metal Roof Contract", html: metalRoofHtml, fields: metalRoofFields },
  { projectType: "Metal Roof With Iso Tapered", name: "Metal Roof With Iso Tapered Contract", html: metalRoofIsoHtml, fields: metalRoofIsoFields },
  { projectType: "Skylight", name: "Skylight Contract", html: skylightHtml, fields: skylightFields },
  { projectType: "Tapered", name: "Tapered Contract", html: taperedHtml, fields: taperedFields },
  { projectType: "Flat Roofing Document", name: "Flat Roofing Document", html: flatRoofingHtml, fields: flatRoofingFields },
  { projectType: "Representantes", name: "Representantes", html: representantesHtml, fields: representantesFields },
  { projectType: "W9 Form", name: "W9 Form", html: w9Html, fields: w9Fields },
  { projectType: "Fence", name: "Fence Agreement", html: fenceHtml, fields: fenceFields },
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getTemplatesByProjectTypes(projectTypeNames: string[]): ContractTemplate[] {
    return templates;
}
