"use client"
import {Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Camera, Share, Sparkles, Save, Download } from 'lucide-react'
import React, { useState, useEffect } from 'react'
import { THEME_NAME_LIST, THEMES } from '@/data/Themes'
import { ProjectType, ScreenConfig } from '@/type/types'
import axios from 'axios'
import html2canvas from 'html2canvas'
import { useParams } from 'next/navigation'

 type Props = {
  projectDetail: ProjectType | undefined
  screenConfig: ScreenConfig[]
  onThemeChange: (theme: string) => void
  onScreenAdded: () => void
}

function SettingSection({projectDetail, screenConfig, onThemeChange, onScreenAdded}:Props) {

  const { projectId } = useParams();
  const[selectedTheme,setSelectedTheme]=useState(projectDetail?.theme || 'AURORA_INK')
  const [projectName, setProjectName] = useState(projectDetail?.projectName || '');
  const [userNewScreenInput, setUserNewScreenInput] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (projectDetail) {
      setProjectName(projectDetail?.projectName || '');
      setSelectedTheme(projectDetail?.theme || 'AURORA_INK');
    }
  }, [projectDetail])

  const handleThemeChange = async (theme: string) => {
    setSelectedTheme(theme);
    try {
      await axios.post('/api/update-theme', {
        projectId: projectId,
        theme: theme
      });
      onThemeChange(theme);
    } catch (error) {
      console.error('Error updating theme:', error);
    }
  }

  const handleGenerateNewScreen = async () => {
    if (!userNewScreenInput.trim()) return;

    setLoading(true);
    try {
      await axios.post('/api/generate-new-screen', {
        projectId: projectId,
        userInput: userNewScreenInput,
        projectVisualDescription: projectDetail?.userInput,
        theme: selectedTheme
      });
      setUserNewScreenInput('');
      onScreenAdded();
    } catch (error) {
      console.error('Error generating new screen:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleSaveScreen = async (screen: ScreenConfig) => {
    if (!screen.code) return;

    try {
      const result = await axios.post('/api/save-screen', {
        projectId: projectId,
        screenId: screen.screenId,
        htmlCode: screen.code,
        screenName: screen.screenName
      });
      alert(result.data.message);
    } catch (error) {
      console.error('Error saving screen:', error);
      alert('Failed to save screen');
    }
  }

  const handleDownload = async (screen: ScreenConfig) => {
    if (!screen.code) return;

    try {
      // Fetch full HTML from the save-screen API logic (simplified by creating a blob here)
      // We can also fetch the saved file content if needed, but blob is faster for the user.
      const response = await axios.post('/api/save-screen', {
        projectId: projectId,
        screenId: screen.screenId,
        htmlCode: screen.code,
        screenName: screen.screenName
      });

      const blob = new Blob([response.data.fullHtml], { type: 'text/html' });
      // Note: For the most accurate download (with theme), we'd need the fullHtml 
      // but since we just saved it, we can tell the user it's in their folder or 
      // trigger a browser download.
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${screen.screenName}.html`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      alert("Downloading " + screen.screenName + ". Check your Downloads folder!");
    } catch (error) {
      console.error('Error downloading screen:', error);
    }
  }

  const handleScreenshot = async (screen: ScreenConfig) => {
    const iframe = document.querySelector(`iframe[data-screen-id="${screen.screenId}"]`) as HTMLIFrameElement;
    if (!iframe) {
      alert('Screen not found for screenshot');
      return;
    }

    try {
      // Get the iframe document
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        alert('Cannot access screen content');
        return;
      }

      // Use html2canvas to capture the iframe content
      const canvas = await html2canvas(iframeDoc.body, {
        useCORS: true,
        allowTaint: true,
        scale: 2,
        width: iframe.offsetWidth,
        height: iframe.offsetHeight
      });

      const screenshotData = canvas.toDataURL('image/png');

      const result = await axios.post('/api/screenshot', {
        screenId: screen.screenId,
        screenshotData: screenshotData,
        screenName: screen.screenName
      });

      alert(result.data.message);
    } catch (error) {
      console.error('Error taking screenshot:', error);
      alert('Failed to take screenshot');
    }
  }

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert('Project URL copied to clipboard!');
  }

  return (
    <div className='w-[300px] h-[90vh] p-5 border-r overflow-y-auto'>
        <h2 className='font-medium text-lg'>Settings</h2>

        <div className='mt-3'>
            <h2 className='text-sm mb-1'>Project Name</h2>
        <Input placeholder='Project Name'
        value={projectName}
        onChange={(event)=>setProjectName(event.target.value)}
        />
       </div>

       <div className='mt-5'>
            <h2 className='text-sm mb-1'>Generate new screen</h2>
        <Textarea placeholder= 'Enter prompt to generate screen using ai'
        value={userNewScreenInput}
        onChange={(event)=>setUserNewScreenInput(event.target.value)}
        />
        <Button
          size={'sm'}
          className='mt-2 w-full'
          onClick={handleGenerateNewScreen}
          disabled={loading}
        >
          <Sparkles className='mr-2' />
          {loading ? 'Generating...' : 'Generate with ai'}
        </Button>
       </div>

       <div className='mt-5'>
            <h2 className='text-sm mb-1'>Themes</h2>
            <div className='h-[200px] overflow-auto'>
              <div>
                {THEME_NAME_LIST.map((theme, index) => (
                <div
                key={index}
                className={`p-3 border rounded-xl mb-2 cursor-pointer ${theme==selectedTheme ? 'border-primary bg-primary/20': ''}`}
                  onClick={()=>handleThemeChange(theme)}>
                  <h2>{theme}</h2>
                    <div className='flex gap-2'>
                      <div className={`h-4 w-4 rounded-full`}
                      style={{background: THEMES[theme].primary}}
                      />

                      <div className={`h-4 w-4 rounded-full`}
                      style={{background: THEMES[theme].secondary}}
                      />

                      <div className={`h-4 w-4 rounded-full`}
                      style={{background: THEMES[theme].accent}}
                      />

                      <div className={`h-4 w-4 rounded-full`}
                      style={{background: THEMES[theme].background}}
                      />

                      <div className="h-4 w-4 rounded-full"
                      style={{
                        background: `linear-gradient(
                        135deg,
                        ${THEMES[theme].background},
                        ${THEMES[theme].primary},
                        ${THEMES[theme].accent})`
                      }} />

                    </div>
                  </div>
                ))}
              </div>
            </div>
        </div>

         <div className='mt-5'>
            <h2 className='text-sm mb-1'>Screens</h2>
            <div className='space-y-2'>
              {screenConfig?.map((screen, index) => (
                <div key={index} className='p-2 border rounded-lg'>
                  <h3 className='text-sm font-medium'>{screen.screenName}</h3>
                  <div className='flex gap-1 mt-2'>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => handleSaveScreen(screen)}
                      disabled={!screen.code}
                    >
                      <Save className='h-3 w-3 mr-1' />
                      Save
                    </Button>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => handleDownload(screen)}
                      disabled={!screen.code}
                    >
                      <Download className='h-3 w-3 mr-1' />
                      Download
                    </Button>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => handleScreenshot(screen)}
                      disabled={!screen.code}
                    >
                      <Camera className='h-3 w-3 mr-1' />
                      Screenshot
                    </Button>
                  </div>
                </div>
              ))}
            </div>
        </div>

         <div className='mt-5'>
            <h2 className='text-sm mb-1'>Extras</h2>
      <div className='flex gap-3 flex-col'>
        <Button size={'sm'} variant={'outline'} onClick={handleShare}>
          <Share className='mr-2' />
          Share Project
        </Button>
      </div>
       </div>

    </div>
  )
}

export default SettingSection