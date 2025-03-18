import moment from 'moment'
import { Tooltip } from 'react-tooltip'

function EntryCreationDate({ id, date }: { id: string; date: string }) {
  return (
    <div className="z-50 hidden w-1/5 shrink-0 items-center md:flex">
      <div
        className="text-bg-500 dark:text-bg-500 z-50 shrink-0"
        data-tooltip-content={moment(date).format('MMMM Do YYYY, h:mm:ss a')}
        data-tooltip-id={`date-tooltip-${id}`}
      >
        {moment(date).fromNow()}
      </div>
      <Tooltip className="z-50" id={`date-tooltip-${id}`} />
    </div>
  )
}

export default EntryCreationDate
