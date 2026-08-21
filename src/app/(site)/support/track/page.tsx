import { TrackRequestPanel } from "@/components/support/TrackRequestPanel";

export default async function TrackSupportRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; token?: string }>;
}) {
  const { code, token } = await searchParams;

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-lg font-bold text-slate-900 mb-1">
        Theo dõi yêu cầu hỗ trợ
      </h1>
      <p className="text-sm text-slate-500 mb-6">
        Kiểm tra trạng thái yêu cầu hỗ trợ bạn đã gửi.
      </p>
      <TrackRequestPanel initialCode={code} initialToken={token} />
    </div>
  );
}
