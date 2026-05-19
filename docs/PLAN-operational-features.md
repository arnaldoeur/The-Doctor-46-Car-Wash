# Plan: Operational Features Integration

This plan details the implementation strategy for adding 10 business-critical operational features to the **The Doctor 46 Car Wash** management system while maintaining a **100% visual lock** on the premium UI, sidebar structure, dark theme, and typography.

---

## 🏗️ 1. VAT / IVA Management System
- **Services/Catalog Setup:** Add `vat_enabled` (With VAT vs. Without VAT) and `vat_included` (IVA incluso toggle) fields to services in the Catalog.
- **Engine Logic:**
  - If VAT is enabled and included:
    $$\text{Subtotal} = \text{Total} / (1 + \text{VAT Rate})$$
    $$\text{VAT Amount} = \text{Total} - \text{Subtotal}$$
  - If VAT is enabled and excluded:
    $$\text{Subtotal} = \text{Base Price}$$
    $$\text{VAT Amount} = \text{Base Price} \times \text{VAT Rate}$$
    $$\text{Total} = \text{Subtotal} + \text{VAT Amount}$$
  - If VAT is disabled:
    $$\text{Subtotal} = \text{Base Price}$$
    $$\text{VAT Amount} = 0$$
    $$\text{Total} = \text{Base Price}$$
- **Document Rendering:** In PDF templates, show detailed breakdowns: Subtotal, VAT Rate (e.g. 16% or Isento), VAT Amount, and Total.
- **Finance separation:** Separate total revenues into "With VAT" and "Without VAT" groups in the financial overview tables and reports.

---

## 🏷️ 2. Promotional Services System
- **Catalog Fields:** Add `is_promotional` (boolean), `promotional_price` (number | null), `promo_start_date` (string | null), `promo_end_date` (string | null).
- **POS Display & Checkout:** POS will display a red/amber promotional tag showing the discounted price and automatically apply the promotional price during checkout if the current date is within the promo dates.
- **Reporting:** Tag sales containing promotional items in finance reports to track promotional campaigns.

---

## 👤 3. Operator / User Tracking
- **Session Info:** Capture `operator_id`, `operator_name`, and `role` of the currently logged-in user.
- **Audit Logging:** Every critical change (POS sales, stock adjustments, status changes in the Queue, document downloads, team alterations) must record the operator in `doctor46_mock_audit_logs`.
- **UI Displays:** Show who performed the action in Finance detail modals, Queue ticket histories, Billing documents, and Audit history tables.

---

## 🏢 4. Company Branding on Documents
- **Official Look:** Render an elegant company branding block on PDF receipts/invoices.
- **Branding Header:** Incorporate a premium logo element (SVG design), official tax registration (NUIT), address, contact information, bank details (BCI Bank Transfer details) inside the generated printable sheets.

---

## 📊 5. Advanced Stock Analytics
- **Calculations:** 
  - Rank products by sale frequency (`movement_type = 'sale'`).
  - Flag items where current quantity is below `min_stock`.
  - Draw dynamic movement charts showing daily consumption (`usage` vs `restock`).
- **Dashboard Display:** Integrate low stock widgets, visual performance graphs, and top/least sold listings on the Inventory screen without breaking layout cards.

---

## 🔒 6. Authentication & Access Control
- **Login Flow:** Validate credentials against `doctor46_mock_staff` accounts in `apiClient.ts`.
- **Access Middleware:** Check user's role on dashboard entry.
- **Roles:**
  - **Administrator:** Full write and delete access.
  - **Employee:** Limited operational actions (disable Settings page, Team Management, Catalog deletion, and hidden Finance graphs).

---

## 🔄 7. Full System Synchronization
- **One-Click Pipeline:** 
  $$\text{POS Checkout} \rightarrow \text{Add Document} \rightarrow \text{Adjust Stock Qty} \rightarrow \text{Register Finance Income} \rightarrow \text{Add Queue Tkt} \rightarrow \text{Log Audit}$$
- Seamless async state propagation in React so clicking "Pagar" completes all data alterations instantly.

---

## 💾 8. Data Persistence & Offline Fallback
- **Persistent LocalStorage:** Remove page-load wipe `removeItem` calls in `App.tsx`.
- **API Cache Interceptors:** Check local storage in `apiClient.ts` if HTTP calls fail to provide offline reliability.

---

## 📱 9. Mobile Experience Smoothness
- Fix table scrollbars in POS & Documents.
- Enhance modal touch zones and visual loading micro-animations.

---

## 📋 Implementation Checklist & Dependency Graph

### Tasks
1. **[P0] Remove initial reset in `App.tsx` & establish full LocalStorage hooks in `apiClient.ts`**
   - *Agent:* frontend-specialist / database-architect
   - *Verify:* Reloading the page does not reset custom catalog services or audit logs.
2. **[P1] Extend `apiClient.ts` mock schemas with VAT, promotions, and operators**
   - *Agent:* backend-specialist / database-architect
   - *Verify:* New mock catalog and documents schema include promotional and VAT fields.
3. **[P1] Refactor Authentication & Route Guards (`AdminLogin.tsx`, `AdminProtectedRoute.tsx`, `AuthProvider.tsx`)**
   - *Agent:* security-auditor / frontend-specialist
   - *Verify:* Logged-in Operator sessions persist, roles (Admin/Employee) restrict unauthorized screens.
4. **[P1] Connect POS to complete full cycle (Stock reduction, Queue, Finance, Documents)**
   - *Agent:* frontend-specialist / backend-specialist
   - *Verify:* POS payment automatically triggers inventory deduction, finance ledger additions, and queue insertions.
5. **[P2] Complete VAT separation & promotions toggle in `Catalog.tsx`, `POS.tsx` and `Finance.tsx`**
   - *Agent:* frontend-specialist
   - *Verify:* Pricing calculations dynamically recalculate Subtotal and VAT on screen.
6. **[P2] Implement Company Branding & SVG Logo on Receipt/Invoice PDFs inside `Documents.tsx` & `Billing.tsx`**
   - *Agent:* frontend-specialist / documentation-writer
   - *Verify:* Generated PDFs look elegant and present bank info, tax registration (NUIT), and logo correctly.
7. **[P3] Implement Advanced Stock Analytics & dynamic charts in `Inventory.tsx`**
   - *Agent:* frontend-specialist / performance-optimizer
   - *Verify:* Inventory graphs dynamically plot sales frequency, low stock alerts, and usage trends.
8. **[P3] Mobile experience fixes (scrollable table styling, modals touch target padding)**
   - *Agent:* frontend-specialist / performance-optimizer
   - *Verify:* Modals fit and respond smoothly on narrow screens.
9. **[Phase X] Run complete verification suite (`verify_all.py`, `npm run linter`)**
   - *Agent:* test-engineer
   - *Verify:* 0 compiler warnings, all modules are fully operational.
