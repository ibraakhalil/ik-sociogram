import MainLayout from "@/components/layout/MainLayout";
import LeftSidebar from "@/components/sidebar/LeftSidebar";
import RightSidebar from "@/components/sidebar/RightSidebar";
import FeedContainer from "@/components/feed/FeedContainer";

export default function Home() {
  return (
    <MainLayout>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[17rem_minmax(0,1fr)_19rem] xl:gap-8">
        <div className="hidden lg:block">
          <LeftSidebar />
        </div>
        <div className="min-w-0">
          <FeedContainer />
        </div>
        <div className="hidden lg:block">
          <RightSidebar />
        </div>
      </div>
    </MainLayout>
  );
}
