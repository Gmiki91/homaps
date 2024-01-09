import { useState } from "react";
import EventForm from "./EventForm";
import { MyEvent, Habit } from "./Models";
import Tooltip from "./Tooltip";
type Props = {
  habit: Habit,
  onSubmit: () => void
}
type HeatMapItem = {
  date: Date,
  event: MyEvent | null
}

function Heatmap({ habit, onSubmit }: Props) {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear()); 
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

  const heatMapList = getDatesForYear(currentYear);
  /*
  Fill year with past events, -1 to place event on the 0th index
  */

  habit.events
    .filter(event => new Date(event.fullDate).getFullYear() === currentYear)
    .forEach(element => heatMapList[element.dayOfYear - 1].event = element);

  //const mapType = habit.freq == "daily" ? { gridTemplateColumns: 'repeat(50, auto)' } : { gridTemplateColumns: 'repeat(10, auto)' };

  const list = heatMapList.map((heatMapItem, index) => {
    /*
      -no event for the tile => scale: 0
      -event:yes measure:no => scale:10
      -event:yes measure:yes => scale:x
    */
    const event = heatMapItem.event;
    const scale = event ? (habit.measure ? Math.round((event.qty! / habit.highestQty!) * 5) : 5) : 0;
    let colorScale = "color" + scale;

    let tooltipText = `${heatMapItem.date.toLocaleDateString("de-DE", { year: "numeric", month: "long", day: "numeric" })}`;
    if (event) {
      if (event.qty === 0) {
        colorScale = "defaultColor";
        tooltipText = `${event.note}\n ${tooltipText}`;
      } else {
        const measureText = habit.measure ? `\n${event.qty} ${habit.unit}\n` : '\n';
        tooltipText = `${event.note} ${measureText} ${tooltipText}`;
      }
    }
    const child = <div key={index} className={`${colorScale} item`}></div>;
    return <Tooltip key={index} text={tooltipText}>{child}</Tooltip>
  });

  return <div className="heatmap">
    <div className="title row">
      <h3>{habit.title}</h3>
    </div>
    <div className="row">
      <EventForm onSubmit={(onSubmit)} habit={habit}></EventForm>
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