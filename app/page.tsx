import Map from '@/components/Map';

export default function Home() {
  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col">
      <Map className="flex-1" />
    </div>
  );
}
