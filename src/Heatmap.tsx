import EventForm from "./EventForm";
import { MyEvent, Habit } from "./Models";
import Tooltip from "./Tooltip";
type Props = {
  habit: Habit,
  daysInYear: number
}
type HeatMapItem = {
  date: Date,
  event: MyEvent | null
}

function Heatmap({ daysInYear, habit }: Props) {

  const currentYear = 2024;
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
  const heatMapList = getDatesForYear(new Date().getFullYear());
  /*
  Fill year with past events, -1 to place event on the 0th index
  */
  habit.events.forEach(element => heatMapList[element.dayOfYear - 1].event = element);

  const mapType = habit.freq == "daily" ? { gridTemplateColumns: 'repeat(50, auto)' } : { gridTemplateColumns: 'repeat(10, auto)' };

  const list = heatMapList.map((heatMapItem, index) => {
    /*
      -no event for the tile => scale: 0
      -event:yes measure:no => scale:10
      -event:yes measure:yes => scale:x
    */
    const event = heatMapItem.event;
    const scale = event ? (habit.measure ? Math.round((event.qty! / habit.highestQty!) * 5) : 5) : 0;
    const colorScale = "color" + scale;
    const child = <div key={index} className={`${colorScale} item`}></div>;
    let tooltipText = `${heatMapItem.date.toLocaleDateString()}`;
    if (event) {
      const measureText = habit.measure ? `\n${event.qty} ${habit.unit}\n` : '\n';
      tooltipText = `${event.note} ${measureText} ${heatMapItem.date.toLocaleDateString()}`;
    }
    return <Tooltip key={index} text={tooltipText}>{child}</Tooltip>
  });

  return <div className="heatmap">
    <EventForm habit={habit}></EventForm>
    <div className="container">
      <h3>{habit.title}</h3>
      <span>{currentYear}</span>
      <div className="list" style={mapType}>
        {list}
      </div>
    </div>
  </div>

}
export default Heatmap;