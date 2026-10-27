// TEMPORARY layout-diagnostics route. Remove after the layout audit.
import {useParams} from 'react-router-dom';
import Home from '@/pages/Home';
import Studio from '@/pages/Studio';
import Origin from '@/pages/Origin';
import Knowledge from '@/pages/Knowledge';
import Spark from '@/pages/Spark';
import Library from '@/pages/Library';
import DirectorLab from '@/pages/DirectorLab';
import ArgonEngine from '@/pages/ArgonEngine';
import LooseScrew from '@/pages/LooseScrew';
import AiWorkshopOs from '@/pages/AiWorkshopOs';
import OpenClawHub from '@/pages/OpenClawHub';
import OrificeRelay from '@/pages/OrificeRelay';
import HermesHub from '@/pages/HermesHub';
import ProductionFactory from '@/pages/ProductionFactory';
import Connect from '@/pages/Connect';
import AgentMonitor from '@/pages/AgentMonitor';
import FraymusArchitecture from '@/pages/FraymusArchitecture';
import FraymusPartner from '@/pages/FraymusPartner';

const PAGES={dashboard:Home,studio:Studio,origin:Origin,knowledge:Knowledge,spark:Spark,library:Library,'director-lab':DirectorLab,argon:ArgonEngine,'loose-screw':LooseScrew,'ai-workshop':AiWorkshopOs,openclaw:OpenClawHub,'orifice-relay':OrificeRelay,hermes:HermesHub,factory:ProductionFactory,connect:Connect,'agent-monitor':AgentMonitor,architecture:FraymusArchitecture,partner:FraymusPartner};

export default function LayoutPreview(){
 const {name}=useParams();
 const Page=PAGES[name];
 return Page?<Page/>:<p>Unknown page</p>;
}