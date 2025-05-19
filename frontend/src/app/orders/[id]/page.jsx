import AccessBlock from "@/components/AccessBlock";
import OrderDetailPage from "@/components/pages/OrderDetailPage";

export default async function OrderDetailServerPage() {
    return(
        <AccessBlock>
            <OrderDetailPage />
        </AccessBlock>
    )
}
