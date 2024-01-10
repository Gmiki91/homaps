import { useCallback, useState } from "react";
import EventForm from "./EventForm";
import { MyEvent, Habit } from "./Models";
import Tooltip from "./Tooltip";
import axios from "axios";
import { event } from "@tauri-apps/api";
type Props = {
  habitObj: Habit,
}
type HeatMapItem = {
  date: Date,
  event: MyEvent | null
}

function Heatmap({ habitObj }: Props) {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [habit, setHabit] = useState({ ...habitObj });

  const submit = useCallback(() => {
    axios.get(`http://localhost:4040/${habit._id}`).then((response) => { setHabit(response.data.result) });
  }, [habit]);


  const remove = (eventDate: number) => {
      console.log("hi")
      axios.delete(`http://localhost:4040/${habit._id}/${eventDate}`).then(() => {
        submit();
      }).catch(error => alert(error.message));
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
      .filter(event => new Date(event.fullDate).getFullYear() === currentYear)
      .forEach(element => list[element.dayOfYear - 1].event = element);
    return responseArr;
  }
  //const mapType = habit.freq == "daily" ? { gridTemplateColumns: 'repeat(50, auto)' } : { gridTemplateColumns: 'repeat(10, auto)' };
  const emptyList = getDatesForYear(currentYear);
  const filledList = fillYear(emptyList);
  const list = filledList.map((heatMapItem) => {
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
    const child = <div key={heatMapItem.date.valueOf()} className={`${colorScale} item`}></div>;
    return <Tooltip empty={event == null} key={heatMapItem.date.valueOf()} text={tooltipText} remove={() => { remove(event!.fullDate) }}>{child}</Tooltip>
  });

  return <div className="heatmap">
    <div className="title row">
      <h3>{habit.title}</h3>
    </div>
    <div className="row">
      <EventForm onSubmit={(submit)} habit={habit}></EventForm>
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