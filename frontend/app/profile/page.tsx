import MainLayout from "@/components/layout/MainLayout";
import LeftSidebar from "@/components/sidebar/LeftSidebar";
import ProfileContainer from "@/components/profile/ProfileContainer";

export default function ProfilePage() {
  return (
    <MainLayout>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[17rem_minmax(0,1fr)] xl:gap-8">
        <div className="hidden lg:block">
          <LeftSidebar />
        </div>
        <div className="min-w-0 max-w-4xl">
          <ProfileContainer />
        </div>
      </div>
    </MainLayout>
  );
}
