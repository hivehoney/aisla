import AccessBlock from "@/components/AccessBlock";
import POSPage from "@/components/pages/POSPage";

export default async function POSServerPage() {
    return(
        <AccessBlock>
            <POSPage />
        </AccessBlock>
    )
}
