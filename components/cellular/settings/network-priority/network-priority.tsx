import NetworkPriorityCard from "./network-priority-card";

const NetworkPrioritySettings = () => {
  return (
    <div className="@container/main mx-auto p-2">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">网络优先级设置</h1>
        <p className="text-muted-foreground">
          设置首选的网络接入顺序。
        </p>
      </div>
      <div className="grid grid-cols-1 @3xl/main:grid-cols-2 grid-flow-row gap-4">
        <NetworkPriorityCard />
      </div>
    </div>
  );
};

export default NetworkPrioritySettings;
