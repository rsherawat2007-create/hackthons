import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/layouts/AppLayout";
import { Protected } from "@/components/Protected";
import { Landing } from "@/pages/Landing";
import { Login } from "@/pages/Login";
import { Register } from "@/pages/Register";
import { CreatorsSearch } from "@/pages/CreatorsSearch";
import { CreatorProfile } from "@/pages/CreatorProfile";
import { PortfolioDetail } from "@/pages/PortfolioDetail";
import { BrandDashboard } from "@/pages/BrandDashboard";
import { CreatorDashboard } from "@/pages/CreatorDashboard";
import { AiBriefBuilder } from "@/pages/AiBriefBuilder";
import { BriefDetail } from "@/pages/BriefDetail";
import { ShortlistPage } from "@/pages/ShortlistPage";
import { EngagementsPage } from "@/pages/EngagementsPage";
import { CreatorProfileEdit } from "@/pages/CreatorProfileEdit";
import { PortfolioManage } from "@/pages/PortfolioManage";
import { BriefsPage } from "@/pages/BriefsPage";
import { BriefNew } from "@/pages/BriefNew";
import { BriefEdit } from "@/pages/BriefEdit";
import { PhoneVerificationPage } from "@/pages/PhoneVerificationPage";
import { CreatorHubAiPage } from "@/pages/CreatorHubAiPage";
import { CreatorComparePage } from "@/pages/CreatorComparePage";
import { PricingPage } from "@/pages/PricingPage";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-phone" element={<PhoneVerificationPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/upgrade" element={<PricingPage />} />
        <Route path="/assistant" element={<CreatorHubAiPage />} />
        <Route path="/ai-assistant" element={<CreatorHubAiPage />} />
        <Route path="/creators" element={<CreatorsSearch />} />
        <Route path="/compare" element={<CreatorComparePage />} />
        <Route path="/creators/compare" element={<CreatorComparePage />} />
        <Route path="/creators/:id" element={<CreatorProfile />} />
        <Route path="/portfolio/:id" element={<PortfolioDetail />} />
        <Route path="/ai-brief-builder" element={<AiBriefBuilder />} />
        <Route
          path="/dashboard/brand"
          element={
            <Protected role="BRAND">
              <BrandDashboard />
            </Protected>
          }
        />
        <Route
          path="/dashboard/creator"
          element={
            <Protected role="CREATOR">
              <CreatorDashboard />
            </Protected>
          }
        />
        <Route
          path="/briefs"
          element={
            <Protected role="BRAND">
              <BriefsPage />
            </Protected>
          }
        />
        <Route
          path="/briefs/new"
          element={
            <Protected role="BRAND">
              <BriefNew />
            </Protected>
          }
        />
        <Route
          path="/briefs/:id"
          element={
            <Protected>
              <BriefDetail />
            </Protected>
          }
        />
        <Route
          path="/briefs/:id/edit"
          element={
            <Protected role="BRAND">
              <BriefEdit />
            </Protected>
          }
        />
        <Route
          path="/shortlist"
          element={
            <Protected role="BRAND">
              <ShortlistPage />
            </Protected>
          }
        />
        <Route
          path="/engagements"
          element={
            <Protected>
              <EngagementsPage />
            </Protected>
          }
        />
        <Route
          path="/creator/profile"
          element={
            <Protected role="CREATOR">
              <CreatorProfileEdit />
            </Protected>
          }
        />
        <Route
          path="/creator/portfolio"
          element={
            <Protected role="CREATOR">
              <PortfolioManage />
            </Protected>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
