import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function JsonTable({ data }) {
  // 데이터가 배열이 아닌 경우 배열로 변환
  const tableData = Array.isArray(data) ? data : [data]

  if (tableData.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground bg-muted/50 rounded-md">
        표시할 데이터가 없습니다.
      </div>
    )
  }

  const headers = Object.keys(tableData[0])

  return (
    <div className="rounded-md border overflow-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            {headers.map((header, index) => (
              <TableHead 
                key={index} 
                className="font-medium whitespace-nowrap"
              >
                {header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {tableData.map((item, rowIndex) => (
            <TableRow 
              key={rowIndex}
              className={rowIndex % 2 === 0 ? 'bg-background' : 'bg-muted/50'}
            >
              {headers.map((header, cellIndex) => (
                <TableCell 
                  key={cellIndex}
                  className="max-w-[300px] overflow-hidden text-ellipsis"
                >
                  {typeof item[header] === 'object' 
                    ? JSON.stringify(item[header])
                    : item[header]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}