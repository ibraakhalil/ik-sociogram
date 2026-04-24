import MainLayout from "@/components/layout/MainLayout";
import ProfileContainer from "@/components/profile/ProfileContainer";
import LeftSidebar from "@/components/sidebar/LeftSidebar";

type UserProfilePageProps = {
  params: Promise<{
    userId: string;
  }>;
};

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const { userId } = await params;

  return (
    <MainLayout>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[17rem_minmax(0,1fr)] xl:gap-8">
        <div className="hidden lg:block">
          <LeftSidebar />
        </div>
        <div className="min-w-0 max-w-4xl">
          <ProfileContainer userId={userId} />
        </div>
      </div>
    </MainLayout>
  );
}
