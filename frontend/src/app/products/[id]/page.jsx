import AccessBlock from "@/components/AccessBlock";
import ProductDetailPage from "@/components/pages/ProductDetailPage";

export default async function ProductDetailServerPage() {
    return(
        <AccessBlock>
            <ProductDetailPage />
        </AccessBlock>
    )
}
