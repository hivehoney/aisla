import AccessBlock from "@/components/AccessBlock";
import ScannerPage from "@/components/pages/ScannerPage";

export default async function ScannerServerPage() {
    return(
        <AccessBlock>
            <ScannerPage />
        </AccessBlock>
    )
}
