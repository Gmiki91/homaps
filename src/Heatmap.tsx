import { useCallback, useEffect, useState } from "react";
import EventForm from "./EventForm";
import { MyEvent, Habit } from "./Models";
import Tooltip from "./Tooltip";
import { invoke } from "@tauri-apps/api";
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
  const [filledList, setFilledList] = useState<HeatMapItem[]>([]);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [habit, setHabit] = useState({ ...habitObj });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [yearlyTotal, setYearlyTotal] = useState(0);
  const [allTimeTotal, setAllTimeTotal] = useState(0);


  useEffect(() => {
    let total = 0;
    if (habit.measure) {
      habit.events.forEach(event => {
        total += event.qty;
      });
    } else {
      total = habit.events.length;
    }
    setAllTimeTotal(total);
  }, [habit])

  useEffect(() => {
    const emptyList = getDatesForYear();
    fillYear(emptyList);
  }, [currentYear, habit])

  const addEvent = async (event: MyEvent) => {
    return invoke<Habit>('add_event', { obj: event, oid: habitObj._id, })
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
    invoke<Habit>('remove_event', { fullDate: eventDate, oid: habitObj._id, })
      .then(response => setHabit(response))
      .catch(error => alert(error));
  }

  /*
  Fill year with empty events
  */
  const getDatesForYear = useCallback(() => {
    const startDate = new Date(currentYear, 0, 1); // January 1st of the specified year
    const endDate = new Date(currentYear + 1, 0, 0); // December 31st of the specified year

    const heatMapArr: HeatMapItem[] = [];
    let currentDate = startDate;

    while (currentDate <= endDate) {
      heatMapArr.push({ date: new Date(currentDate), event: null });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return heatMapArr;
  }, [currentYear])

  /*
  Fill year with past events, -1 to place event on the 0th index
  */
  const fillYear = useCallback((list: HeatMapItem[]) => {
    const responseArr = [...list];
    const eventsInThisYear = habit.events.filter(event => new Date(event.full_date * 100000).getFullYear() === currentYear);
    let count = 0;
    eventsInThisYear.forEach(element => {
      count += element.qty;
      list[element.day_of_year - 1].event = element;
    });
    count = habit.measure ? count : eventsInThisYear.length;
    setYearlyTotal(count);
    setFilledList(responseArr);
  }, [habit, currentYear]);

  const list = filledList.map((heatMapItem) => {
    const event = heatMapItem.event;
    /*
      -no event for the tile => scale: 0
      -event:yes measure:no => scale:6 (middleish)
      -event:yes measure:yes => scale:1-8
    */
    const scale = event ? (habit.measure ? Math.ceil((event.qty / habit.highest_qty) * 8) : 6) : 0;
    const color = Colors[habit.color][scale];

    let tooltipText = `${heatMapItem.date.toLocaleDateString("de-DE", { year: "2-digit", month: "long", day: "numeric", weekday: "long" })}`;

    if (event) {
      if (habit.measure) {
        const measureText = `${event.qty} ${habit.unit}\n`;
        tooltipText = `${measureText} ${tooltipText}\n`;
      }
      if (event.note != "") {
        tooltipText = `\n${event.note}\n\n${tooltipText}`;
      }
      tooltipText = `${event.project}\n${tooltipText}`;
    }
    const selected = selectedDate.setHours(0, 0, 0, 0) == heatMapItem.date.getTime() ? "selected" : "";
    const style = { backgroundColor: scale > 0 ? color : "" };
    const child = <div key={heatMapItem.date.valueOf()} className={`item ${selected}`} style={style} onClick={() => setSelectedDate(heatMapItem.date)}></div>;
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
        <div className="summary">
          <div>
            <span>This year's total: </span>
            <span>{habit.unit=="min" ? `${Math.floor(yearlyTotal/60)}h ${yearlyTotal%60}m`:`${yearlyTotal} ${habit.unit || 'days'}`}</span>
          </div>
          <div>
            <span>All time total: </span>
            <span>{habit.unit=="min" ?`${Math.floor(allTimeTotal/60)}h ${allTimeTotal%60}m`:`${allTimeTotal} ${habit.unit || 'days'}`}</span>
          </div>
        </div>
      </div>
    </div>
  </div>

}
export default Heatmap;