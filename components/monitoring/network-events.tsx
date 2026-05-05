import NetworkEventsCard from "./network-events-card";

const NetworkEventsComponent = () => {
  return (
    <div className="@container/main mx-auto p-2">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">网络事件</h1>
        <p className="text-muted-foreground">
          频段切换、掉线、信号变化等由轮询守护进程记录的蜂窝事件。
        </p>
      </div>
      <div className="grid grid-cols-1 @3xl/main:grid-cols-2 grid-flow-row gap-4">
        <NetworkEventsCard />
      </div>
    </div>
  );
};

export default NetworkEventsComponent;
