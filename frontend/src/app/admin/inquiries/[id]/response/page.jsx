import AccessBlock from "@/components/AccessBlock";
import InquiryResponsePage from "@/components/pages/InquiryResponsePage";

export default async function InquiryResponseServerPage({ params }) {
    const { id } = await params
  return(
    <AccessBlock role="admin">
      <InquiryResponsePage id={id} />
    </AccessBlock>
  )
}
