import InventoryPanel from "../components/InventoryPanel";
import TopSellersPanel from "../components/TopSellersPanel";
import SectionLabel from "../components/SectionLabel";

export default function InventoryPage() {
  return (
    <>
      <InventoryPanel />
      <SectionLabel>Top sellers</SectionLabel>
      <TopSellersPanel />
    </>
  );
}
