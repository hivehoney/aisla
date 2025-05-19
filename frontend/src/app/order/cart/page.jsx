import AccessBlock from "@/components/AccessBlock";
import OrderCartPage from "@/components/pages/OrderCartPage";

export default async function HistoryPage() {
    return(
        <AccessBlock>
            <OrderCartPage />
        </AccessBlock>
    )
}
