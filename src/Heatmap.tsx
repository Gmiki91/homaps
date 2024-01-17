import {  useState } from "react";
import EventForm from "./EventForm";
import { MyEvent, Habit } from "./Models";
import Tooltip from "./Tooltip";
import {  invoke } from "@tauri-apps/api";
import { Colors } from "./Colors";
type Props = {
  habitObj: Habit,
  onRemoveHabit: () => void
}
type HeatMapItem = {
  date: Date,
  event: MyEvent | null
}
function Heatmap({ habitObj, onRemoveHabit }: Props) {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [habit, setHabit] = useState({ ...habitObj });
  const [selectedDate,setSelectedDate] = useState(new Date());

  const addEvent = async (event: MyEvent)=>{
   return invoke<Habit>('add_event',{obj:event,oid:habitObj._id,})
    .then(response => {
      setHabit(response);
      return Promise.resolve(true);
    })
    .catch(error => {
      alert(error);
      return Promise.resolve(false);
    });
  }

  const removeEvent = (eventDate: number) => {
    invoke<Habit>('remove_event',{fullDate:eventDate,oid:habitObj._id,})
    .then(response => setHabit(response))
    .catch(error => alert(error));
  }

  /*
  Fill year with empty events
  */
  function getDatesForYear(year: number) {
    const startDate = new Date(year, 0, 1); // January 1st of the specified year
    const endDate = new Date(year + 1, 0, 0); // December 31st of the specified year

    const heatMapArr: HeatMapItem[] = [];
    let currentDate = startDate;

    while (currentDate <= endDate) {
      heatMapArr.push({ date: new Date(currentDate), event: null });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return heatMapArr;
  }

  /*
  Fill year with past events, -1 to place event on the 0th index
  */
  const fillYear = (list: HeatMapItem[]) => {
    const responseArr = [...list];
    habit.events
      .filter(event => new Date(event.full_date*100000).getFullYear() === currentYear)
      .forEach(element => list[element.day_of_year - 1].event = element);
    return responseArr;
  }
  const emptyList = getDatesForYear(currentYear);
  const filledList = fillYear(emptyList);
  const list = filledList.map((heatMapItem) => {
    const event = heatMapItem.event;
    /*
      -no event for the tile => scale: 0
      -event:yes measure:no => scale:4 (middle)
      -event:yes measure:yes => scale:1-6
    */
    const scale = event ? (habit.measure && event.qty > 0 ? Math.ceil((event.qty / habit.highest_qty) * 8) : 5) : 0;
    const color = Colors[habit.color][scale];

    let tooltipText = `${heatMapItem.date.toLocaleDateString("de-DE", { year: "2-digit", month: "long", day: "numeric", weekday:"long" })}`;
    if (event) {
      if (event.qty > 0) {
        const measureText = habit.measure ? `${event.qty} ${habit.unit}\n` : '\n';
        tooltipText = `${measureText} ${tooltipText}\n`;
      }
      if(event.note!=""){
        tooltipText = `\n${event.note}\n\n${tooltipText}`;
      }
      tooltipText = `${event.project}\n${tooltipText}`;
    }
   let style:{backgroundColor?:string,outline:string|undefined} = {outline:selectedDate.setHours(0,0,0,0)==heatMapItem.date.getTime() ? `1px solid` : undefined};
   scale>0 ? style.backgroundColor= color : null;
    const child = <div key={heatMapItem.date.valueOf()} className={`item`} style={style} 
    onClick={()=>setSelectedDate(heatMapItem.date)}></div>;
    return <Tooltip empty={event == null} key={heatMapItem.date.valueOf()} text={tooltipText} remove={() => { removeEvent(event!.full_date) }}>{child}</Tooltip>
  });

  return <div className="heatmap">
    <div className="title">
      <span onClick={onRemoveHabit}>&#x2718;</span>
      <h3>{habit.title}</h3>
    </div>
    <div className="row">
      <EventForm habit={habit} selectedDate={selectedDate} onSubmit={addEvent} ></EventForm>
      <div className="container">
        <div className="year_selector">
          <span className="arrow" onClick={() => setCurrentYear((prevData) => prevData - 1)}>&#x2190;</span>
          <span>{currentYear}</span>
          <span className="arrow" onClick={() => setCurrentYear((prevData) => prevData + 1)}>&#8594;</span>
        </div>
        <div className="list" >
          {list}
        </div>
      </div>
    </div>
  </div>

}
export default Heatmap;