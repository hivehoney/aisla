import AccessBlock from "@/components/AccessBlock";
import OrderSearchPage from "@/components/pages/OrderSearchPage";

export default async function HistoryPage() {
    return(
        <AccessBlock>
            <OrderSearchPage />
        </AccessBlock>
    )
}
