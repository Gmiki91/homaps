import { Color } from "./Colors";

export type MyEvent = {
  fullDate: number,
  dayOfYear: number,
  project:string,
  note: string,
  qty: number,
}
export type Habit = {
  _id?:string;
  title:string,
  color:Color,
  freq:"daily"|"weekly",
  events:MyEvent[],
  measure:boolean;
  unit?:string
  highestQty:number;
}