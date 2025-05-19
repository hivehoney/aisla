import AccessBlock from "@/components/AccessBlock";
import RobotsPage from "@/components/pages/RobotsPage";

export default async function RobotsServerPage() {
    return(
        <AccessBlock>
            <RobotsPage />
        </AccessBlock>
    )
}
