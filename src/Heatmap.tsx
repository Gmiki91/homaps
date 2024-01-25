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

const months = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
const monthsLong = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

function Heatmap({ habitObj, onRemoveHabit }: Props) {
  const [filledList, setFilledList] = useState<HeatMapItem[]>([]);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [hoverMonth, setHoverMonth] = useState(-1);
  const [habit, setHabit] = useState({ ...habitObj });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [yearlyTotal, setYearlyTotal] = useState(0);
  const [allTimeTotal, setAllTimeTotal] = useState(0);

  useEffect(() => {
    const monthlyCount = getCounter("monthly", 0, currentMonth)
    const yearlyCount = getCounter("yearly", 0, 0)
    const totalCount = getCounter("alltime", 0, 0)
    setMonthlyTotal(monthlyCount);
    setYearlyTotal(yearlyCount);
    setAllTimeTotal(totalCount);
  }, [habit])

  useEffect(() => {
    const emptyList = getDatesForYear();
    fillYear(emptyList);
  }, [currentYear, habit])

  const onMouseDown = async(e: React.MouseEvent<HTMLDivElement, MouseEvent>, item:HeatMapItem) =>{
    e.preventDefault();
    if(e.button==0){
      setSelectedDate(item.date)
    }else if (e.button==2 && item.event){
      const confirmation = await confirm('Are you sure you wish to delete this item?');
      if (confirmation) {
        removeEvent(item.event.full_date);
      }
    }

  }
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

  const changeYear = (i: number) => {
    const yearlyCount = getCounter("yearly", i, 0);
    const monthlyCount = getCounter("monthly", i, currentMonth);
    setCurrentYear((prevData) => prevData + i);
    setMonthlyTotal(monthlyCount);
    setYearlyTotal(yearlyCount);
  }

  const changeMonth = (i: number) => {
    const monthlyCount = getCounter("monthly", 0, i);
    setMonthlyTotal(monthlyCount);
    setCurrentMonth(i);
  }

  const getCounter = (arg: "monthly" | "yearly" | "alltime", yearChange: number, monthChange: number) => {
    let events = habit.events;
    switch (arg) {
      // @ts-ignore
      case "monthly": events = events.filter(event => new Date(event.full_date * 100000).getMonth() === monthChange);
      case "yearly": events = events.filter(event => new Date(event.full_date * 100000).getFullYear() == currentYear + yearChange);
    }

    if (habit.measure) {
      let count = 0;
      events.forEach(element => {
        count += element.qty;
      });
      return count;
    } else {
      return events.length;
    }
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
    eventsInThisYear.forEach(element => {
      list[element.day_of_year - 1].event = element;
    });
    setFilledList(responseArr);
  }, [habit, currentYear]);

  const list = filledList.map(heatMapItem => {
    const event = heatMapItem.event;
    /*
      -no event for the tile => scale: 0
      -event:yes measure:no => scale:6 (middleish)
      -event:yes measure:yes => scale:1-8
    */
    const scale = event ? (habit.measure ? Math.round(
      (((event.qty-habit.median) / habit.highest_qty)*4)+4) 
      : 6) : 0;
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
    const style: { backgroundColor: string, boxShadow: string } = {
      boxShadow: heatMapItem.date.getMonth() == hoverMonth ? "0px 0px 4px 3px grey" : "",
      backgroundColor: scale > 0 ? color : ""
    }
    const child = <div key={heatMapItem.date.valueOf()} className={`item ${selected} `} style={style} onMouseDown={(e) => onMouseDown(e,heatMapItem)}></div>;
    return <Tooltip key={heatMapItem.date.valueOf()} text={tooltipText}>{child}</Tooltip>
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
          <span className="arrow" onClick={() => changeYear(-1)}>&#x2190;</span>
          <span>{currentYear}</span>
          <span className="arrow" onClick={() => changeYear(1)}>&#8594;</span>
        </div>
        <div className="month_list flex_row">
          {months.map((month, i) =>
            <span key={i} style={{ cursor: "pointer", color: currentMonth == i ? "grey" : "" }}
              onClick={() => changeMonth(i)} onMouseOver={() => setHoverMonth(i)} onMouseLeave={() => setHoverMonth(-1)}>
              {month}
            </span>)}
        </div>
        <div className="list" >
          {list}
        </div>
        <div className="summary">
          <div>
            <span>{monthsLong[currentMonth]}: </span>
            <span>{habit.unit == "min" ? `${Math.floor(monthlyTotal / 60)}h ${monthlyTotal % 60}m` : `${monthlyTotal} ${habit.unit || 'days'}`}</span>
          </div>
          <div>
            <span>{currentYear}: </span>
            <span>{habit.unit == "min" ? `${Math.floor(yearlyTotal / 60)}h ${yearlyTotal % 60}m` : `${yearlyTotal} ${habit.unit || 'days'}`}</span>
          </div>
          <div>
            <span>All time: </span>
            <span>{habit.unit == "min" ? `${Math.floor(allTimeTotal / 60)}h ${allTimeTotal % 60}m` : `${allTimeTotal} ${habit.unit || 'days'}`}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
}
export default Heatmap;