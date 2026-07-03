import Sidebar from "@/components/layout/sidebar/sidebar";

export default function Loading() {
  return (
    <>
      <Sidebar />
      <div className="page-loader-overlay">
        <div className="page-loader-spinner"></div>
        <span className="page-loader-text">Loading console parameters...</span>
      </div>
    </>
  );
}
