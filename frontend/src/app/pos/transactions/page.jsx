import AccessBlock from "@/components/AccessBlock";
import TransactionsPage from "@/components/pages/TransactionsPage";

export default async function TransactionsServerPage() {
    return(
        <AccessBlock>
            <TransactionsPage />
        </AccessBlock>
    )
}
