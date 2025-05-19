import AccessBlock from "@/components/AccessBlock";
import RobotDetailPage from "@/components/pages/RobotDetailPage";

export default async function RobotDetailServerPage() {
    return(
        <AccessBlock>
            <RobotDetailPage />
        </AccessBlock>
    )
}
