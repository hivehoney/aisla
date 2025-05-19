import AccessBlock from "@/components/AccessBlock";
import OrdersPage from "@/components/pages/OrdersPage";

export default async function OrdersServerPage() {
    return(
        <AccessBlock>
            <OrdersPage />
        </AccessBlock>
    )
}
