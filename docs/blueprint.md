# **App Name**: AgriTrace

## Core Features:

- Role-Based Authentication: Secure sign-up/login with Firebase Auth, with role-based access control (Farmer, Distributor, Retailer, Consumer).
- Produce Batch Creation: Farmer dashboard to create new produce batches (product type, quantity, location, harvest date, quality grade). Generates a unique batchId and QR code linked to this batch. A tool will compute a hash and record on the blockchain for future integrity verification. 
- Ownership Transfer Logging: Distributor dashboard to scan/enter QR code and log ownership transfer to Retailer, who confirms receipt. Each transfer is recorded.
- Retailer Pricing: Retailer sets sale price for batch, updating the price history.
- Consumer QR Scan & Trace: Consumers scan QR codes to view full product journey: farmer details, distribution history, retailer info, and price. Includes verification.
- QR Code Generation: Generate QR codes for each batch.
- Supply Chain Timeline: A chronological timeline view of the produce's journey from farm to consumer.

## Style Guidelines:

- Primary color: Earthy Green (#8FBC8F), representing agriculture and nature.
- Background color: Light beige (#F5F5DC), for a natural, unobtrusive feel.
- Accent color: Muted orange (#D2691E), evoking harvest and freshness; for calls to action.
- Font pairing: 'Belleza' (sans-serif) for headlines and short chunks of text; 'Alegreya' (serif) for body text, for a balance of modern and readable styles.
- Use minimalist icons to represent different stages in the supply chain (planting, harvesting, transportation, etc.).
- Mobile-first, card-based layout to highlight key information for each role.
- Subtle transitions and animations on data updates and QR code scanning.