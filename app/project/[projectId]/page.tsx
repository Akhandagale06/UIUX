"use client"
import React, { useEffect, useState } from 'react'
import ProjectHeader from './_shared/ProjectHeader'
import SettingSection from './_shared/SettingSection'
import axios from 'axios'
import { useParams } from 'next/navigation'
import { ProjectType, ScreenConfig } from '@/type/types'
import { THEMES } from '@/data/Themes'
import { Loader2Icon } from 'lucide-react'
import Canvas from './_shared/Canvas'

function ProjectCanvasPlayground() {
    const { projectId } = useParams();
    const [projectDetail, setProjectDetail] = useState<ProjectType>();
    const [screenConfigOriginal, setScreenConfigOriginal] = useState<ScreenConfig[]>([]);
    const [screenConfig, setScreenConfig] = useState<ScreenConfig[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMsg, setLoadingMsg] = useState('Loading');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [currentTheme, setCurrentTheme] = useState<string>('AURORA_INK');

    // ✅ Prevents infinite loop
    const hasGenerated = React.useRef(false);

    const handleThemeChange = (theme: string) => {
        setCurrentTheme(theme);
        // Update projectDetail state so ScreenFrames detect the change
        setProjectDetail(prev => prev ? { ...prev, theme } : prev);
        
        // No need to manually regex-replace the code anymore, 
        // as ScreenFrame handles the theme via its internal template.
    };

    const handleScreenAdded = async () => {
        setErrorMessage(null);
        try {
            const result = await axios.get(`/api/user/project?projectId=${projectId}`);
            setScreenConfig(result?.data?.screenConfig || []);
        } catch (error: any) {
            console.error('Error refreshing screen config:', error);
            setErrorMessage(error?.response?.data?.error || 'Unable to refresh screen list.');
        }
    };

    useEffect(() => {
        projectId && GetProjectDetail();
    }, [projectId]);

    // ✅ Only depends on projectDetail, not screenConfig
    useEffect(() => {
        if (!projectDetail || hasGenerated.current) return;
        hasGenerated.current = true;

        const initializeProject = async () => {
            if (!screenConfigOriginal || screenConfigOriginal.length === 0) {
                await generateScreenConfig();
            } else {
                await GenerateScreenUIUX();
            }
        };

        initializeProject();
    }, [projectDetail]);

    const GetProjectDetail = async () => {
        setLoading(true);
        setLoadingMsg('Loading...');
        try {
            const result = await axios.get('/api/user/project?projectId=' + projectId);
            setProjectDetail(result?.data?.projectDetail);
            setScreenConfigOriginal(result?.data?.screenConfig);
            setScreenConfig(result?.data?.screenConfig);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching project:", error);
            setLoading(false);
        }
    };

    const generateScreenConfig = async () => {
        setLoading(true);
        setLoadingMsg('Generating Screens Config');
        setErrorMessage(null);
        try {
            await axios.post('/api/generate-config', {
                projectId: projectId,
                deviceType: projectDetail?.device,
                userInput: projectDetail?.userInput
            });
            // Fetch updated data
            const result = await axios.get('/api/user/project?projectId=' + projectId);
            const newScreens = result?.data?.screenConfig;
            
            setProjectDetail(result?.data?.projectDetail);
            setScreenConfigOriginal(newScreens);
            setScreenConfig(newScreens);

            // Trigger UI generation for the new screens
            if (newScreens && newScreens.length > 0) {
                await GenerateScreenUIUX(newScreens);
            }
        } catch (error: any) {
            console.error('Error generating screen config:', error);
            setErrorMessage(error?.response?.data?.error || 'Error generating screen config.');
        } finally {
            setLoading(false);
        }
    };

    const GenerateScreenUIUX = async (screensToGenerate?: ScreenConfig[]) => {
        setLoading(true);
        const screens = screensToGenerate || screenConfig;

        for (let index = 0; index < screens?.length; index++) {
            const screen = screens[index];
            if (screen?.code) continue;

            setLoadingMsg('Generating UI for screen ' + (index + 1));
            try {
                const result = await axios.post('/api/generate-screen-ui', {
                    projectId,
                    screenId: screen?.screenId,
                    screenName: screen?.screenName,
                    purpose: screen?.purpose,
                    screenDescription: screen?.screenDescription,
                    projectVisualDescription: (projectDetail as any)?.projectVisualDescription,
                    theme: projectDetail?.theme,
                });

                setScreenConfig(prev => prev.map((item) =>
                    item.screenId === screen.screenId ? result.data : item
                ));
            } catch (error: any) {
                console.error('Error generating UI for screen:', error);
                setErrorMessage(error?.response?.data?.error || 'Failed to generate screen UI.');
                break; // Stop loop if credits are exhausted
            }
        }
        setLoading(false);
    };

    return (
        <div>
            <ProjectHeader />
            <div className='flex items-start gap-6'>
                <SettingSection
                  projectDetail={projectDetail}
                  screenConfig={screenConfig}
                  onThemeChange={handleThemeChange}
                  onScreenAdded={handleScreenAdded}
                />
                <div className='flex-1'>
                    {loading && (
                        <div className='p-3 absolute bg-blue-300/20 border-blue-400 rounded-xl left-1/2 top-20'>
                            <h2 className='flex gap-2 items-center'>
                                <Loader2Icon className='animate-spin' /> {loadingMsg}
                            </h2>
                        </div>
                    )}
                    {errorMessage && (
                        <div className='mx-6 mb-4 rounded-xl border border-red-300 bg-red-50 p-4 text-red-700'>
                            <strong>Error:</strong> {errorMessage}
                        </div>
                    )}
                    <Canvas
                        projectDetail={projectDetail}
                        screenConfig={screenConfig}
                    />
                </div>
            </div>
        </div>
    );
}

export default ProjectCanvasPlayground;