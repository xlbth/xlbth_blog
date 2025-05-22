# 内核打印

echo 1 > /proc/sys/kernel/printk

echo 7 > /proc/sys/kernel/printk

# i2c

cat /sys/bus/i2c/devices/*/name

i2cdetect -l

i2cdetect -y

i2cdump -f -y 3 0x62

cat /sys/kernel/debug/gpio