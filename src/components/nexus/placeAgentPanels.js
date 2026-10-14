export default function placeAgentPanels(layout) {
 if(layout.some(panel=>panel.tabs.includes('performance')))return layout;
 const activity=layout.find(panel=>panel.tabs.includes('activity'));
 if(activity)return layout.map(panel=>panel.id===activity.id?{...panel,tabs:[...panel.tabs,'performance'],active:'performance'}:panel);
 return [...layout,{id:'performance',tabs:['performance'],active:'performance',x:48,y:8,w:50,h:84}];
}