import { Color } from "./Colors";
export type HeatMapItem = {
  date: Date,
  event: MyEvent | null
}
export type MyEvent = {
  full_date: number,
  day_of_year: number,
  project:string,
  note: string,
  qty: number,
}
export type Habit = {
  _id?:number,
  title:string,
  color:Color,
  events:MyEvent[],
  measure:boolean;
  unit:string
  highest_qty:number;
  median:number;
}