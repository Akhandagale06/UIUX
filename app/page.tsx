import Header from "./_shared/Header";
import Hero from "./_shared/Hero";

export default function Home() {
  return (
    <div className="relative overflow-hidden min-h-screen">
      <Header/>
      <Hero/>
      <div className="absolute -top-40 -left-40 
      h-[500px]  w-[500px] bg-purple-400/20 blur-[120px] rounded-full -z-10"></div>

            <div className="absolute -top-40 -right-[-200px] 
      h-[500px]  w-[500px] bg-blue-400/20 blur-[120px] rounded-full -z-10"></div>

            <div className="absolute -top-40 -bottom-[-200px] left-1/3
      h-[500px]  w-[500px] bg-blue-400/20 blur-[120px] rounded-full -z-10"></div>

            <div className="absolute top-[200px] left-1/2
      h-[500px]  w-[500px] bg-purple-400/20 blur-[120px] rounded-full -z-10"></div>
      </div>
  );
}
