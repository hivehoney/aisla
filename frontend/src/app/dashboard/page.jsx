import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import AccessBlock from "@/components/AccessBlock";
import DashboardClient from "@/components/pages/DashboardClient";

export default function DashboardPage(){
  return (
    <AccessBlock>
      <DashboardClient />
    </AccessBlock>
  )
}