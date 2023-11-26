# Logger

这是一个日志写入模块，采用更方便的形式去输出日志而不增加使用者的负担。

## 参数

模块会导出一个方法，执行传入参数即可

- name 命名空间，相同
- options Object
  - pattern 日志输出格式，默认: {TIME} [{LEVEL}] [{NAME}]
  - time_format 日志输出的日期格式，默认 2020-01-01 12:12:12
  - record_day 日志记录的时间间隔
  - level 日志输出的日志等级
  - export_file 输出至文件
