export type MyEvent = {
  fullDate: number,
  dayOfYear: number,
  note: string,
  qty?: number,
}
export type Habit = {
  _id?:string;
  title:string,
  color:string,
  freq:"daily"|"weekly",
  events:MyEvent[],
  measure:boolean;
  unit?:string
  highestQty:number;
}