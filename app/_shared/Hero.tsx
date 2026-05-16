"use client"
import React, { useState } from 'react'
import { ChevronRight, Loader, Send } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea
} from "@/components/ui/input-group"
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { AnimatedGradientText } from '@/components/ui/animated-gradient-text'
import { suggestions } from '@/data/constant'
import {useAuth,  useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import axios from 'axios'


function Hero() {
  const [userInput, setUserInput] = useState<string>("")
  const [device,setDevice]=useState<string>('website')
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

const onCreateProject = async () => {
  if (!isLoaded) return;

  if (!user) {
    router.push("/sign-in");
    return;
  }

  if (!userInput.trim()) return;

  setLoading(true);

  const projectId = crypto.randomUUID();

  try {
    const token = await getToken();

    const result = await axios.post(
      "/api/user/project",
      {
        userInput,
        device,
        projectId,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log(result.data);

    router.push("/project/" + projectId);

  } catch (error) {
    console.error("Project Create Error:", error);
  } finally {
    setLoading(false);
  }
};
  return (
    <div className='p-10 md:px-24 lg:px-48 xl:px-60 mt-8'>
      <div className='flex items-center justify-center w-full mb-5'> 
        <div className="group relative max-w-sm flex items-center justify-center rounded-full px-4 py-1.5 shadow-[inset_0_-8px_10px_#8fdfff1f] transition-shadow duration-500 ease-out hover:shadow-[inset_0_-5px_10px_#8fdfff3f]">  
      <span
        className={cn(
          "animate-gradient absolute inset-0 block h-full w-full rounded-[inherit] bg-gradient-to-r from-[#ffaa40]/50 via-[#9c40ff]/50 to-[#ffaa40]/50 bg-[length:300%_100%] p-[1px]"
        )}
        style={{
          WebkitMask:
            "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "destination-out",
          mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          maskComposite: "subtract",
          WebkitClipPath: "padding-box",
        }}
      />
      🎉 <hr className="mx-2 h-4 w-px shrink-0 bg-neutral-500" />
      <AnimatedGradientText className="text-sm font-medium">
        Introducing Magic UI
      </AnimatedGradientText>
      <ChevronRight className="ml-1 size-4 stroke-neutral-500 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />
    </div>
  </div>
        <h2 className='text-5xl font-bold text-center'>Design your <span className='text-primary'>UIUX</span> in seconds with our AI-powered <br />
            <span className='text-primary'>Website & mobile app</span>
        </h2>
        <p className='text-center text-gray-600 text-lg mt-3'><b>Design and innovate</b></p>
         <div className="flex mt-5 w-full gap-6 items-center justify-center">
      <InputGroup className='max-w-xl bg-white rounded-2xl'>
      <InputGroupTextarea
          data-slot="input-group-control"
          className="flex field-sizing-content min-h-24 w-full resize-none rounded-md bg-transparent px-3 py-2.5 text-base transition-[color,box-shadow] outline-none md:text-sm"
          placeholder="Enter the prompt"
          value={userInput}
          onChange={(event)=>setUserInput(event.target.value)}

      />
        <InputGroupAddon align="block-end">

        <Select defaultValue='website' onValueChange={(value)=>setDevice(value)}>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Type" />
  </SelectTrigger>
  <SelectContent>
    <SelectGroup>
      <SelectItem value="website">Website</SelectItem>
      <SelectItem value="mobile">Mobile</SelectItem>
    
    </SelectGroup>
  </SelectContent>
</Select>
          <InputGroupButton className="ml-auto" 
          disabled={loading}
          size="sm" variant="default" 
          onClick={()=>onCreateProject()}>
          {loading?<Loader className='animate-spin'/>: <Send/> }
            
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
     
      <div className='flex gap-3 mt-4'>
        {suggestions.map((suggestion, index) => (
          <div key={index} className='p-2 border rounded-2xl 
          flex flex-col items-center bg-white z-10 cursor-pointer' 
           onClick={() => setUserInput(suggestion?.description)}>
            <h2 className='text-lg'>{suggestion?.icon}</h2>
            <h2 className='text-center line-clamp-2 text-sm'>{suggestion?.name}</h2>
          </div>
        ))}
      </div>
    </div>

  )
}

export default Hero