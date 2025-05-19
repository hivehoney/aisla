import AccessBlock from "@/components/AccessBlock";
import InquiryAdminPage from "@/components/pages/InquiryAdminPage";

export default function InquiryAdminServerPage() {
  return(
    <AccessBlock role="admin">
      <InquiryAdminPage />
    </AccessBlock>
  )
}
